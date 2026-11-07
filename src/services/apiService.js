import * as XLSX from 'xlsx';
import { CONFIG, INITIAL_DOCUMENTS } from '../config/constants';

// Starter / Mock Document IDs to permanently exclude in production
const MOCK_DOC_IDS = new Set([
  'DOC-2026-001', 'DOC-2026-002', 'DOC-2026-003',
  'DOC-2026-004', 'DOC-2026-005', 'DOC-2026-006',
  'DOC-2026-007', 'DOC-2026-008'
]);

class ApiService {
  constructor() {
    this.settings = this.loadSettings();
  }

  // Filter out any mock/simulated documents
  cleanDocsList(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(d => d && !MOCK_DOC_IDS.has(d.id));
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // อัปเกรดชื่อระบบเป็น KBS HR Docs อัตโนมัติ
        if (!parsed.appNameTh || parsed.appNameTh === 'ระบบรวบรวมเอกสารงานบุคคล') {
          parsed.appNameTh = 'KBS HR Docs';
        }
        if (!parsed.appNameEn || parsed.appNameEn === 'HR Document Hub' || parsed.appNameEn === 'KBS HR Hub') {
          parsed.appNameEn = 'KBS HR Docs';
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return {
      gasUrl: CONFIG.DEFAULT_GAS_URL || '',
      sheetId: CONFIG.SHEET_ID,
      driveFolderId: CONFIG.DRIVE_FOLDER_ID,
      adminPin: CONFIG.DEFAULT_PIN,
      appNameTh: 'KBS HR Docs',
      appNameEn: 'KBS HR Docs',
      schoolName: CONFIG.SCHOOL_NAME,
      departmentName: CONFIG.DEPARTMENT_NAME,
      developer: CONFIG.DEVELOPER_NAME,
      tagline: CONFIG.TAGLINE
    };
  }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));

    // Two-way sync: ส่งค่าไปอัปเดตลง Google Sheet ในแท็บ 'ตั้งค่าระบบ'
    if (this.settings.gasUrl && this.settings.gasUrl.trim() !== '') {
      try {
        fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateSettings',
            settings: this.settings
          })
        }).catch(err => console.warn('Sync settings to Sheet failed:', err));
      } catch (e) {
        console.warn('Sync settings error:', e);
      }
    }

    return this.settings;
  }

  // Load all documents + Sync live settings from Sheet
  async getDocuments() {
    if (this.settings.gasUrl && this.settings.gasUrl.trim() !== '') {
      try {
        const url = new URL(this.settings.gasUrl.trim());
        url.searchParams.set('action', 'getDocuments');
        url.searchParams.set('_t', Date.now().toString());

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success) {
            // ซิงก์การตั้งค่าและรหัสผ่านล่าสุดจาก Google Sheet
            if (resJson.settings && typeof resJson.settings === 'object') {
              this.settings = { ...this.settings, ...resJson.settings };
              localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
            }

            if (Array.isArray(resJson.data)) {
              const cleaned = this.cleanDocsList(resJson.data);
              const normalized = cleaned.map(d => this.normalizeDoc(d));
              localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(normalized));
              return {
                data: normalized,
                settings: this.settings,
                isLive: true,
                message: 'ดึงข้อมูลสดจาก Google Sheet สำเร็จ'
              };
            }
          }
        }
      } catch (err) {
        console.warn('Live GAS fetch failed, falling back to local storage:', err);
      }
    }

    // Fallback: LocalStorage
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_KEY_DOCS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const cleaned = this.cleanDocsList(parsed);
          const normalized = cleaned.map(d => this.normalizeDoc(d));
          localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(normalized));
          return { data: normalized, settings: this.settings, isLive: false, message: 'แสดงข้อมูลจากความจำเครื่อง (ออฟไลน์)' };
        }
      }
    } catch (e) {
      console.error('Local cache read error:', e);
    }

    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify([]));
    return { data: [], settings: this.settings, isLive: false, message: 'ยังไม่มีเอกสารในระบบ' };
  }

  // Normalize document to ensure attachments array always exists
  normalizeDoc(doc) {
    if (!doc) return doc;
    let attachments = doc.attachments;
    if (typeof attachments === 'string' && attachments.trim() !== '') {
      try {
        attachments = JSON.parse(attachments);
      } catch (e) {
        attachments = null;
      }
    }
    if (!Array.isArray(attachments) || attachments.length === 0) {
      if (doc.fileUrl) {
        attachments = [{
          name: doc.fileName || doc.title || 'เอกสารแนบ',
          url: doc.fileUrl,
          downloadUrl: doc.downloadUrl || doc.fileUrl,
          previewUrl: doc.previewUrl || doc.fileUrl,
          size: doc.fileSize || '',
          type: doc.fileType || 'FILE',
          driveId: doc.driveFileId || ''
        }];
      } else {
        attachments = [];
      }
    }
    return {
      ...doc,
      attachments
    };
  }

  // Helper: Upload a single file to Drive via live GAS endpoint
  async uploadFileToDrive(fileBlob, title = '') {
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());
    if (isLive) {
      try {
        const base64 = await this.fileToBase64(fileBlob);
        const res = await fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'uploadFile',
            fileName: fileBlob.name,
            fileData: base64,
            mimeType: fileBlob.type || 'application/octet-stream',
            title: title || fileBlob.name
          })
        });

        const data = await res.json();
        if (data.success && data.document) {
          // Clean up the temporary row created by uploadFile
          if (data.document.id) {
            fetch(this.settings.gasUrl.trim(), {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'deleteDoc', id: data.document.id })
            }).catch(() => {});
          }

          return {
            name: fileBlob.name,
            url: data.document.fileUrl,
            downloadUrl: data.document.downloadUrl,
            previewUrl: data.document.previewUrl,
            driveId: data.document.driveFileId,
            size: data.document.fileSize || this.formatBytes(fileBlob.size),
            type: data.document.fileType || this.detectFileType(fileBlob.name)
          };
        }
      } catch (err) {
        console.warn('Upload file to Drive error:', err);
      }
    }

    // Local / Offline fallback
    const localUrl = URL.createObjectURL(fileBlob);
    return {
      name: fileBlob.name,
      url: localUrl,
      downloadUrl: localUrl,
      previewUrl: localUrl,
      driveId: '',
      size: this.formatBytes(fileBlob.size),
      type: this.detectFileType(fileBlob.name)
    };
  }

  // Add Document (รองรับ 1 ไฟล์ หรือหลายไฟล์พร้อมกัน)
  async addDocument(docData, newFiles = []) {
    const filesArray = Array.isArray(newFiles) ? newFiles : (newFiles ? [newFiles] : []);
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    let uploadedAttachments = [];
    if (filesArray.length > 0) {
      for (const file of filesArray) {
        const uploaded = await this.uploadFileToDrive(file, docData.title);
        uploadedAttachments.push(uploaded);
      }
    }

    const payloadDoc = { ...docData };
    if (uploadedAttachments.length > 0) {
      const primary = uploadedAttachments[0];
      payloadDoc.fileUrl = primary.url;
      payloadDoc.downloadUrl = primary.downloadUrl;
      payloadDoc.previewUrl = primary.previewUrl;
      payloadDoc.driveFileId = primary.driveId;
      payloadDoc.fileSize = primary.size;
      payloadDoc.fileType = primary.type;
      payloadDoc.fileName = primary.name;
      payloadDoc.attachments = uploadedAttachments;
    }

    if (isLive) {
      try {
        const payload = {
          action: 'addDoc',
          ...payloadDoc,
          attachments: JSON.stringify(uploadedAttachments)
        };

        const response = await fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success && result.document) {
          const finalDoc = this.normalizeDoc({
            ...result.document,
            attachments: uploadedAttachments.length > 0 ? uploadedAttachments : result.document.attachments
          });
          const currentDocs = this.getLocalDocuments();
          currentDocs.unshift(finalDoc);
          localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(currentDocs));
          return { success: true, document: finalDoc, isLive: true };
        }
      } catch (err) {
        console.warn('Add to GAS failed, falling back to local addition:', err);
      }
    }

    // Local addition
    const newDoc = this.normalizeDoc({
      id: 'DOC-' + Date.now(),
      title: payloadDoc.title || (filesArray[0] ? filesArray[0].name : 'เอกสารใหม่'),
      docNumber: payloadDoc.docNumber || '-',
      category: payloadDoc.category || 'แบบฟอร์มใบลาและขออนุญาต',
      fileType: payloadDoc.fileType || 'PDF',
      fileUrl: payloadDoc.fileUrl || CONFIG.DRIVE_URL,
      downloadUrl: payloadDoc.downloadUrl || payloadDoc.fileUrl || CONFIG.DRIVE_URL,
      previewUrl: payloadDoc.previewUrl || payloadDoc.fileUrl || CONFIG.DRIVE_URL,
      driveFileId: payloadDoc.driveFileId || '',
      fileSize: payloadDoc.fileSize || '150 KB',
      fileName: payloadDoc.fileName || '',
      attachments: uploadedAttachments,
      targetAudience: payloadDoc.targetAudience || 'บุคลากรทุกคน',
      academicYear: payloadDoc.academicYear || '2568',
      tags: payloadDoc.tags || '',
      description: payloadDoc.description || '',
      downloadCount: 0,
      viewCount: 0,
      isPinned: Boolean(payloadDoc.isPinned),
      status: 'active',
      createdAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'Admin'
    });

    const currentDocs = this.getLocalDocuments();
    currentDocs.unshift(newDoc);
    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(currentDocs));

    return { success: true, document: newDoc, isLive: false };
  }

  // Update existing document (รองรับหลายไฟล์ + แสดงข้อมูลไฟล์เดิมชัดเจน)
  async updateDocument(docData, newFiles = [], existingFiles = []) {
    const filesArray = Array.isArray(newFiles) ? newFiles : (newFiles ? [newFiles] : []);
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    let uploadedAttachments = [];
    if (filesArray.length > 0) {
      for (const file of filesArray) {
        const uploaded = await this.uploadFileToDrive(file, docData.title);
        uploadedAttachments.push(uploaded);
      }
    }

    const allAttachments = [...(existingFiles || []), ...uploadedAttachments];
    const updatedFields = { ...docData };

    if (allAttachments.length > 0) {
      const primary = allAttachments[0];
      updatedFields.fileUrl = primary.url;
      updatedFields.downloadUrl = primary.downloadUrl;
      updatedFields.previewUrl = primary.previewUrl;
      updatedFields.driveFileId = primary.driveId;
      updatedFields.fileSize = primary.size;
      updatedFields.fileType = primary.type;
      updatedFields.fileName = primary.name;
      updatedFields.attachments = allAttachments;
    }

    if (isLive) {
      try {
        const response = await fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateDoc',
            ...updatedFields,
            attachments: JSON.stringify(allAttachments)
          })
        });

        const result = await response.json();
        if (result.success) {
          const finalDoc = this.normalizeDoc(updatedFields);
          this.updateLocalDocument(finalDoc);
          return { success: true, document: finalDoc, isLive: true };
        }
      } catch (err) {
        console.warn('Update to GAS failed, saving locally:', err);
      }
    }

    // Local / Offline fallback update
    const updated = this.normalizeDoc({
      ...updatedFields,
      updatedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    });

    this.updateLocalDocument(updated);
    return { success: true, document: updated, isLive: false };
  }

  // Delete document
  async deleteDocument(id) {
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    if (isLive) {
      try {
        const payload = {
          action: 'deleteDoc',
          id: id
        };

        const response = await fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          this.deleteLocalDocument(id);
          return { success: true, isLive: true };
        }
      } catch (err) {
        console.warn('Delete from GAS failed, deleting locally:', err);
      }
    }

    this.deleteLocalDocument(id);
    return { success: true, isLive: false };
  }

  // Track download
  async incrementDownload(id) {
    const docs = this.getLocalDocuments();
    const target = docs.find(d => d.id === id);
    if (target) {
      target.downloadCount = (target.downloadCount || 0) + 1;
      localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(docs));
    }

    if (this.settings.gasUrl) {
      try {
        fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'incrementDownload', id })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // Track view
  async incrementView(id) {
    const docs = this.getLocalDocuments();
    const target = docs.find(d => d.id === id);
    if (target) {
      target.viewCount = (target.viewCount || 0) + 1;
      localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(docs));
    }

    if (this.settings.gasUrl) {
      try {
        fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'incrementView', id })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  // Test GAS Web App Connection
  async testConnection(urlToTest) {
    const targetUrl = urlToTest || this.settings.gasUrl;
    if (!targetUrl) {
      throw new Error('กรุณาระบุ URL ของ Google Apps Script Web App');
    }

    const testUrl = new URL(targetUrl.trim());
    testUrl.searchParams.set('action', 'test');
    testUrl.searchParams.set('_t', Date.now().toString());

    const res = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'การเชื่อมต่อล้มเหลว');
    }

    return data;
  }

  // Auto initialize sheet via GAS
  async initSheet(urlToUse) {
    const targetUrl = urlToUse || this.settings.gasUrl;
    if (!targetUrl) {
      throw new Error('กรุณาระบุ URL ของ Google Apps Script Web App');
    }

    const res = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'initSheet' })
    });

    const data = await res.json();
    return data;
  }

  // Export current documents to Excel
  exportToExcel(documents) {
    const exportData = documents.map((doc, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสเอกสาร': doc.id,
      'เลขที่เอกสาร': doc.docNumber || '-',
      'ชื่อเอกสาร': doc.title,
      'หมวดหมู่': doc.category,
      'ชนิดไฟล์': doc.fileType,
      'กลุ่มเป้าหมาย': doc.targetAudience,
      'ปี พ.ศ./การศึกษา': doc.academicYear,
      'แท็ก': doc.tags || '-',
      'รายละเอียด': doc.description || '-',
      'ยอดเปิดดู': doc.viewCount || 0,
      'ยอดดาวน์โหลด': doc.downloadCount || 0,
      'ลิงก์เอกสาร': doc.fileUrl,
      'วันที่บันทึก': doc.createdAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'เอกสารงานบุคคล');

    const fileName = `KBS_HR_Documents_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // Helpers
  getLocalDocuments() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY_DOCS);
      const list = saved ? JSON.parse(saved) : [];
      return Array.isArray(list) ? this.cleanDocsList(list).map(d => this.normalizeDoc(d)) : [];
    } catch {
      return [];
    }
  }

  // Clear all mock and local documents
  clearAllLocalDocuments() {
    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify([]));
  }

  updateLocalDocument(updated) {
    const docs = this.getLocalDocuments();
    const idx = docs.findIndex(d => d.id === updated.id);
    if (idx !== -1) {
      docs[idx] = {
        ...docs[idx],
        ...updated,
        updatedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(docs));
    }
  }

  deleteLocalDocument(id) {
    let docs = this.getLocalDocuments();
    docs = docs.filter(d => d.id !== id);
    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(docs));
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  detectFileType(filename) {
    if (!filename) return 'PDF';
    const ext = filename.split('.').pop().toUpperCase();
    if (['DOC', 'DOCX'].includes(ext)) return 'DOCX';
    if (['XLS', 'XLSX', 'CSV'].includes(ext)) return 'XLSX';
    if (['PPT', 'PPTX'].includes(ext)) return 'PPTX';
    if (['ZIP', 'RAR', '7Z'].includes(ext)) return 'ZIP';
    if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)) return 'IMAGE';
    return 'PDF';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export const apiService = new ApiService();
