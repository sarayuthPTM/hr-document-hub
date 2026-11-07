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
      gasUrl: '',
      sheetId: CONFIG.SHEET_ID,
      driveFolderId: CONFIG.DRIVE_FOLDER_ID,
      adminPin: CONFIG.DEFAULT_PIN
    };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    return this.settings;
  }

  // Load all documents
  async getDocuments() {
    // If Google Apps Script Web App URL is configured, try live fetch
    if (this.settings.gasUrl && this.settings.gasUrl.trim() !== '') {
      try {
        const url = new URL(this.settings.gasUrl.trim());
        url.searchParams.set('action', 'getDocuments');
        url.searchParams.set('_t', Date.now().toString()); // Cache buster

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && Array.isArray(resJson.data)) {
            // Cache to localStorage
            localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(resJson.data));
            return {
              data: resJson.data,
              isLive: true,
              message: 'ดึงข้อมูลสดจาก Google Sheet สำเร็จ'
            };
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
          return { data: parsed, isLive: false, message: 'แสดงข้อมูลจากความจำเครื่อง (ออฟไลน์)' };
        }
      }
    } catch (e) {
      console.error('Local cache read error:', e);
    }

    // Default Seed
    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(INITIAL_DOCUMENTS));
    return { data: INITIAL_DOCUMENTS, isLive: false, message: 'แสดงข้อมูลตัวอย่างเริ่มต้น' };
  }

  // Add Document (Direct upload or link)
  async addDocument(docData, fileBlob = null) {
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    if (isLive) {
      try {
        let payload = {};
        if (fileBlob) {
          // Convert file to Base64
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
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // GAS expects plain text to avoid CORS preflight issues
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success && result.document) {
          // Also update local cache
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

  // Update existing document
  async updateDocument(docData) {
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    if (isLive) {
      try {
        const payload = {
          action: 'updateDoc',
          ...docData
        };

        const response = await fetch(this.settings.gasUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
          this.updateLocalDocument(docData);
          return { success: true, isLive: true };
        }
      } catch (err) {
        console.warn('Update to GAS failed, saving locally:', err);
      }
    }

    // Local update
    this.updateLocalDocument(docData);
    return { success: true, isLive: false };
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

    // Local delete
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
      throw new Error('กรุณาระบุ URL ของ Google Apps Script Web App ก่อนสั่งสร้างตาราง');
    }

    const res = await fetch(targetUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'initSheet' })
    });

    const data = await res.json();
    return data;
  }

  // Export current documents to Excel (.xlsx)
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

    // Auto col width
    const max_width = exportData.reduce((w, r) => Math.max(w, (r['ชื่อเอกสาร'] || '').length), 10);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 14 },
      { wch: Math.min(max_width + 4, 50) },
      { wch: 25 },
      { wch: 10 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 30 },
      { wch: 10 },
      { wch: 12 },
      { wch: 40 },
      { wch: 18 }
    ];

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
