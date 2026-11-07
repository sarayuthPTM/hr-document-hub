import * as XLSX from 'xlsx';
import { CONFIG, INITIAL_DOCUMENTS } from '../config/constants';

class ApiService {
  constructor() {
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return {
      gasUrl: CONFIG.DEFAULT_GAS_URL || '',
      sheetId: CONFIG.SHEET_ID,
      driveFolderId: CONFIG.DRIVE_FOLDER_ID,
      adminPin: CONFIG.DEFAULT_PIN,
      appNameTh: CONFIG.APP_NAME_TH,
      appNameEn: CONFIG.APP_NAME,
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
              localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(resJson.data));
              return {
                data: resJson.data,
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

    // Fallback: LocalStorage or Initial Documents
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_KEY_DOCS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { data: parsed, settings: this.settings, isLive: false, message: 'แสดงข้อมูลจากความจำเครื่อง (ออฟไลน์)' };
        }
      }
    } catch (e) {
      console.error('Local cache read error:', e);
    }

    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(INITIAL_DOCUMENTS));
    return { data: INITIAL_DOCUMENTS, settings: this.settings, isLive: false, message: 'แสดงข้อมูลตัวอย่างเริ่มต้น' };
  }

  // Add Document
  async addDocument(docData, fileBlob = null) {
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    if (isLive) {
      try {
        let payload = {};
        if (fileBlob) {
          const base64 = await this.fileToBase64(fileBlob);
          payload = {
            action: 'uploadFile',
            fileName: fileBlob.name,
            fileData: base64,
            mimeType: fileBlob.type || 'application/octet-stream',
            ...docData
          };
        } else {
          payload = {
            action: 'addDoc',
            ...docData
          };
        }

        const response = await fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success && result.document) {
          const currentDocs = this.getLocalDocuments();
          currentDocs.unshift(result.document);
          localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(currentDocs));
          return { success: true, document: result.document, isLive: true };
        }
      } catch (err) {
        console.warn('Add to GAS failed, falling back to local addition:', err);
      }
    }

    // Local addition
    const newDoc = {
      id: 'DOC-' + Date.now(),
      title: docData.title || (fileBlob ? fileBlob.name : 'เอกสารใหม่'),
      docNumber: docData.docNumber || '-',
      category: docData.category || 'แบบฟอร์มใบลาและขออนุญาต',
      fileType: docData.fileType || (fileBlob ? this.detectFileType(fileBlob.name) : 'PDF'),
      fileUrl: docData.fileUrl || (fileBlob ? URL.createObjectURL(fileBlob) : CONFIG.DRIVE_URL),
      downloadUrl: docData.fileUrl || (fileBlob ? URL.createObjectURL(fileBlob) : CONFIG.DRIVE_URL),
      previewUrl: docData.fileUrl || (fileBlob ? URL.createObjectURL(fileBlob) : CONFIG.DRIVE_URL),
      driveFileId: '',
      fileSize: fileBlob ? this.formatBytes(fileBlob.size) : (docData.fileSize || '150 KB'),
      targetAudience: docData.targetAudience || 'บุคลากรทุกคน',
      academicYear: docData.academicYear || '2568',
      tags: docData.tags || '',
      description: docData.description || '',
      downloadCount: 0,
      viewCount: 0,
      isPinned: Boolean(docData.isPinned),
      status: 'active',
      createdAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'Admin'
    };

    const currentDocs = this.getLocalDocuments();
    currentDocs.unshift(newDoc);
    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(currentDocs));

    return { success: true, document: newDoc, isLive: false };
  }

  // Update existing document (รองรับการอัปโหลดไฟล์ใหม่จากคอมพิวเตอร์แทนที่ไฟล์เดิม)
  async updateDocument(docData, fileBlob = null) {
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    if (isLive) {
      try {
        let payload = {
          action: 'updateDoc',
          ...docData
        };

        if (fileBlob) {
          const base64 = await this.fileToBase64(fileBlob);
          payload.fileName = fileBlob.name;
          payload.fileData = base64;
          payload.mimeType = fileBlob.type || 'application/octet-stream';
          payload.fileType = docData.fileType || this.detectFileType(fileBlob.name);
          payload.fileSize = this.formatBytes(fileBlob.size);
        }

        const response = await fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          const updatedDoc = {
            ...docData,
            ...(result.document || {})
          };
          this.updateLocalDocument(updatedDoc);
          return { success: true, document: updatedDoc, isLive: true };
        }
      } catch (err) {
        console.warn('Update to GAS failed, saving locally:', err);
      }
    }

    // Local / Offline fallback update
    const updated = {
      ...docData,
      updatedAt: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    if (fileBlob) {
      const localUrl = URL.createObjectURL(fileBlob);
      updated.fileUrl = localUrl;
      updated.downloadUrl = localUrl;
      updated.previewUrl = localUrl;
      updated.fileSize = this.formatBytes(fileBlob.size);
      updated.fileType = docData.fileType || this.detectFileType(fileBlob.name);
    }

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
      return saved ? JSON.parse(saved) : [...INITIAL_DOCUMENTS];
    } catch {
      return [...INITIAL_DOCUMENTS];
    }
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
