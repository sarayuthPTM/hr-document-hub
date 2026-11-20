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
    this._activeOrderSavePromise = null;
    this._queuedOrderSerialized = null;
    this._pendingOrderIds = null;
    this._isSavingOrder = false;
    this._activeEbookSavePromise = null;
    this._queuedEbookSerialized = null;
    this._pendingEbookIds = null;
    this._isSavingEbook = false;
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

  /**
   * Parse set of document IDs enabled for 3D E-book Flipbook view.
   */
  getEbookIdsSet(rawValue = null) {
    const source = this._pendingEbookIds !== null
      ? this._pendingEbookIds
      : (rawValue !== null && rawValue !== undefined ? rawValue : this.settings?.ebookDocIds);

    if (Array.isArray(source)) {
      return new Set(source.map(id => String(id)));
    }
    if (typeof source === 'string' && source.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed)) {
          return new Set(parsed.map(id => String(id)));
        }
      } catch {}
    }
    return new Set();
  }

  /**
   * Persist whether a document opens in 3D E-book mode to both LocalStorage & Google Sheet ('ตั้งค่าระบบ').
   */
  async setDocumentEbook(docId, isEbook) {
    if (!docId) return { success: false, synced: false };
    const idStr = String(docId);
    const currentSet = this.getEbookIdsSet();
    if (isEbook) {
      currentSet.add(idStr);
    } else {
      currentSet.delete(idStr);
    }

    const updatedArr = Array.from(currentSet);
    const serialized = JSON.stringify(updatedArr);

    this._pendingEbookIds = updatedArr;
    this._queuedEbookSerialized = serialized;
    this.settings = { ...this.settings, ebookDocIds: serialized };
    localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));

    // Keep cached docs synchronized immediately
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY_DOCS);
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const syncedList = list.map(d => (d && String(d.id) === idStr ? { ...d, isEbook: Boolean(isEbook) } : d));
          localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(syncedList));
        }
      }
    } catch {}

    const gasUrl = this.settings.gasUrl ? this.settings.gasUrl.trim() : '';
    if (!gasUrl) {
      this._isSavingEbook = false;
      this._pendingEbookIds = null;
      return { success: true, synced: false };
    }

    if (this._activeEbookSavePromise) {
      return this._activeEbookSavePromise;
    }

    this._isSavingEbook = true;
    this._activeEbookSavePromise = (async () => {
      let lastResult = { success: true, synced: false };
      try {
        while (this._queuedEbookSerialized !== null) {
          const payloadEbook = this._queuedEbookSerialized;
          this._queuedEbookSerialized = null;
          try {
            const res = await fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'updateSettings',
                settings: { ebookDocIds: payloadEbook }
              })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || data.message || `HTTP ${res.status}`);
            }
            lastResult = { success: true, synced: true };
          } catch (err) {
            console.error('Sync ebookDocIds failed:', err);
            lastResult = { success: false, synced: false, error: err.message || String(err) };
          }
        }
      } finally {
        this._isSavingEbook = false;
        this._pendingEbookIds = null;
        this._activeEbookSavePromise = null;
      }
      return lastResult;
    })();

    return this._activeEbookSavePromise;
  }

  /**
   * Apply Admin's saved custom document order (falls back to pinned -> newest id).
   */
  applyCustomOrder(list, rawCustomOrder = null) {
    if (!Array.isArray(list) || list.length === 0) return [];

    let orderIds = [];
    const effectiveSource = Array.isArray(this._pendingOrderIds) && this._pendingOrderIds.length > 0
      ? this._pendingOrderIds
      : (rawCustomOrder !== null && rawCustomOrder !== undefined ? rawCustomOrder : this.settings?.customDocOrder);

    if (Array.isArray(effectiveSource)) {
      orderIds = effectiveSource.map(id => String(id));
    } else if (typeof effectiveSource === 'string' && effectiveSource.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(effectiveSource);
        if (Array.isArray(parsed)) {
          orderIds = parsed.map(id => String(id));
        }
      } catch {}
    }

    if (orderIds.length === 0) {
      return [...list].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return String(b.id).localeCompare(String(a.id));
      });
    }

    const rankMap = new Map();
    orderIds.forEach((id, idx) => rankMap.set(id, idx));

    return [...list].sort((a, b) => {
      const rankA = rankMap.has(String(a.id)) ? rankMap.get(String(a.id)) : -1;
      const rankB = rankMap.has(String(b.id)) ? rankMap.get(String(b.id)) : -1;
      if (rankA !== -1 && rankB !== -1) return rankA - rankB;
      if (rankA === -1 && rankB !== -1) return -1;
      if (rankA !== -1 && rankB === -1) return 1;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return String(b.id).localeCompare(String(a.id));
    });
  }

  /**
   * Save Admin's custom card order to both LocalStorage and Google Sheet ('ตั้งค่าระบบ').
   * Uses a single-slot coalescing queue so rapid consecutive drags never race.
   */
  async saveDocumentOrder(orderedDocs) {
    const orderedIds = Array.isArray(orderedDocs) ? orderedDocs.map(d => String(d.id)) : [];
    const serialized = JSON.stringify(orderedIds);

    this._pendingOrderIds = orderedIds;
    this._queuedOrderSerialized = serialized;
    this.settings = { ...this.settings, customDocOrder: serialized };
    localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    if (Array.isArray(orderedDocs)) {
      localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(orderedDocs));
    }

    const gasUrl = this.settings.gasUrl ? this.settings.gasUrl.trim() : '';
    if (!gasUrl) {
      this._isSavingOrder = false;
      this._pendingOrderIds = null;
      return { success: true, synced: false };
    }

    if (this._activeOrderSavePromise) {
      return this._activeOrderSavePromise;
    }

    this._isSavingOrder = true;
    this._activeOrderSavePromise = (async () => {
      let lastResult = { success: true, synced: false };
      try {
        while (this._queuedOrderSerialized !== null) {
          const payloadOrder = this._queuedOrderSerialized;
          this._queuedOrderSerialized = null;
          try {
            const res = await fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'updateSettings',
                settings: { customDocOrder: payloadOrder }
              })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
              throw new Error(data.error || data.message || `HTTP ${res.status}`);
            }
            lastResult = { success: true, synced: true };
          } catch (err) {
            console.error('Sync customDocOrder failed:', err);
            lastResult = { success: false, synced: false, error: err.message || String(err) };
          }
        }
      } finally {
        this._isSavingOrder = false;
        this._pendingOrderIds = null;
        this._activeOrderSavePromise = null;
      }
      return lastResult;
    })();

    return this._activeOrderSavePromise;
  }

  /**
   * Fast (~0.5s) read of public 'ตั้งค่าระบบ' sheet via GViz so customDocOrder is known immediately.
   */
  async fetchSettingsFastFromSheet(signal = null) {
    if (!CONFIG.SHEET_ID) return null;
    try {
      const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent('ตั้งค่าระบบ')}&_t=${Date.now()}`;
      const res = await fetch(url, signal ? { signal } : undefined);
      if (!res.ok) return null;
      const text = await res.text();
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1 || endIdx <= startIdx) return null;

      const parsed = JSON.parse(text.slice(startIdx, endIdx + 1));
      const rows = parsed?.table?.rows || [];
      const fastSettings = {};
      for (const row of rows) {
        const cells = row?.c || [];
        const k = cells[0]?.v !== undefined && cells[0]?.v !== null ? String(cells[0].v).trim() : '';
        const v = cells[1]?.v !== undefined && cells[1]?.v !== null ? String(cells[1].v) : '';
        if (k) fastSettings[k] = v;
      }
      return fastSettings;
    } catch (err) {
      return null;
    }
  }

  /**
   * Ultra-fast (~0.5s) read directly from public Google Sheet GViz endpoint (no GAS cold-start delay).
   */
  async fetchDocumentsFastFromSheet() {
    if (!CONFIG.SHEET_ID) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const docsUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent('ข้อมูล')}&_t=${Date.now()}`;
      const [docsRes, fastSettings] = await Promise.all([
        fetch(docsUrl, { signal: controller.signal }),
        this.fetchSettingsFastFromSheet(controller.signal)
      ]);
      if (!docsRes.ok) return null;
      const text = await docsRes.text();
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx === -1 || endIdx <= startIdx) return null;

      const parsed = JSON.parse(text.slice(startIdx, endIdx + 1));
      const cols = parsed?.table?.cols || [];
      const rows = parsed?.table?.rows || [];
      const headers = cols.map(c => String(c.label || c.id || '').trim());

      const list = [];
      for (const row of rows) {
        const cells = row?.c || [];
        const item = {};
        headers.forEach((h, idx) => {
          if (!h) return;
          const cell = cells[idx];
          if (!cell || cell.v === null || cell.v === undefined) {
            item[h] = '';
            return;
          }
          if (h === 'isPinned') {
            item[h] = cell.v === true || String(cell.v).toUpperCase() === 'TRUE';
          } else if (h === 'downloadCount' || h === 'viewCount') {
            item[h] = Number(cell.v) || 0;
          } else if (h === 'createdAt' || h === 'updatedAt') {
            item[h] = cell.f || String(cell.v);
          } else {
            item[h] = cell.v;
          }
        });
        if (!item.id && !item.title) continue;
        list.push(item);
      }

      if (fastSettings && typeof fastSettings === 'object') {
        const preservedOrder = this._isSavingOrder && this._pendingOrderIds
          ? JSON.stringify(this._pendingOrderIds)
          : undefined;
        const preservedEbook = this._isSavingEbook && this._pendingEbookIds
          ? JSON.stringify(this._pendingEbookIds)
          : undefined;
        this.settings = { ...this.settings, ...fastSettings };
        if (preservedOrder !== undefined) this.settings.customDocOrder = preservedOrder;
        if (preservedEbook !== undefined) this.settings.ebookDocIds = preservedEbook;
        localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
      }

      const ebookSet = this.getEbookIdsSet(fastSettings?.ebookDocIds ?? this.settings?.ebookDocIds);
      const cleaned = this.cleanDocsList(list);
      const normalized = cleaned.map(d => this.normalizeDoc(d, ebookSet));
      const ordered = this.applyCustomOrder(normalized, fastSettings?.customDocOrder ?? this.settings?.customDocOrder);
      const hasExtendedSchema = headers.includes('attachments') && headers.includes('steps');
      return { data: ordered, hasExtendedSchema };
    } catch (err) {
      console.warn('Fast GViz fetch skipped:', err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // Load all documents + Sync live settings from Sheet (supports instant fast-callback before GAS settles)
  async getDocuments(onFastData = null) {
    let fastPromise = null;
    if (typeof onFastData === 'function') {
      fastPromise = this.fetchDocumentsFastFromSheet().then((fastRes) => {
        if (fastRes && Array.isArray(fastRes.data)) {
          localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(fastRes.data));
          onFastData(fastRes.data, fastRes.hasExtendedSchema);
        }
        return fastRes;
      });
    }

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
              const preservedOrder = this._isSavingOrder && this._pendingOrderIds
                ? JSON.stringify(this._pendingOrderIds)
                : undefined;
              const preservedEbook = this._isSavingEbook && this._pendingEbookIds
                ? JSON.stringify(this._pendingEbookIds)
                : undefined;
              this.settings = { ...this.settings, ...resJson.settings };
              if (preservedOrder !== undefined) {
                this.settings.customDocOrder = preservedOrder;
              }
              if (preservedEbook !== undefined) {
                this.settings.ebookDocIds = preservedEbook;
              }
              localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
            }

            if (Array.isArray(resJson.data)) {
              const ebookSet = this.getEbookIdsSet(this.settings.ebookDocIds);
              const cleaned = this.cleanDocsList(resJson.data);
              const normalized = cleaned.map(d => this.normalizeDoc(d, ebookSet));
              const ordered = this.applyCustomOrder(normalized, this.settings.customDocOrder);
              localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(ordered));
              return {
                data: ordered,
                settings: this.settings,
                isLive: true,
                message: 'ดึงข้อมูลสดจาก Google Sheet สำเร็จ'
              };
            }
          }
        }
      } catch (err) {
        console.warn('Live GAS fetch failed, checking fast sheet or local storage:', err);
      }
    }

    if (fastPromise) {
      const fastRes = await fastPromise;
      if (fastRes && Array.isArray(fastRes.data)) {
        return { data: fastRes.data, settings: this.settings, isLive: true, message: 'ดึงข้อมูลด่วนจาก Google Sheet สำเร็จ' };
      }
    }

    // Fallback: LocalStorage
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_KEY_DOCS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const ebookSet = this.getEbookIdsSet(this.settings?.ebookDocIds);
          const cleaned = this.cleanDocsList(parsed);
          const normalized = cleaned.map(d => this.normalizeDoc(d, ebookSet));
          const ordered = this.applyCustomOrder(normalized, this.settings?.customDocOrder);
          localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(ordered));
          return { data: ordered, settings: this.settings, isLive: false, message: 'แสดงข้อมูลจากความจำเครื่อง (ออฟไลน์)' };
        }
      }
    } catch (e) {
      console.error('Local cache read error:', e);
    }

    localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify([]));
    return { data: [], settings: this.settings, isLive: false, message: 'ยังไม่มีเอกสารในระบบ' };
  }

  // Normalize document to ensure attachments array and isEbook flag always exist
  normalizeDoc(doc, ebookSetOverride = null) {
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
          driveId: doc.driveFileId || this.extractDriveFileId(doc.fileUrl)
        }];
      } else {
        attachments = [];
      }
    } else {
      attachments = attachments.map((att, idx) => {
        const rawUrl = att.url || att.downloadUrl || att.previewUrl || '';
        const driveId = att.driveId || this.extractDriveFileId(rawUrl);
        return {
          name: att.name || doc.fileName || `${doc.title || 'เอกสาร'} (${idx + 1})`,
          url: att.url || rawUrl,
          downloadUrl: att.downloadUrl || (driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : rawUrl),
          previewUrl: att.previewUrl || (driveId ? `https://drive.google.com/file/d/${driveId}/preview` : rawUrl),
          size: att.size || '',
          type: String(att.type || this.detectFileType(att.name || rawUrl)).toUpperCase(),
          driveId
        };
      });
    }
    const ebookSet = ebookSetOverride instanceof Set ? ebookSetOverride : this.getEbookIdsSet();
    const hasExplicitEbook = doc.isEbook !== undefined && doc.isEbook !== '';
    const resolvedEbook = hasExplicitEbook
      ? (doc.isEbook === true || String(doc.isEbook).toUpperCase() === 'TRUE')
      : ebookSet.has(String(doc.id));

    return {
      ...doc,
      isEbook: resolvedEbook,
      steps: doc.steps !== undefined && doc.steps !== null ? String(doc.steps) : '',
      attachments
    };
  }

  // Extract Google Drive file ID from URL
  extractDriveFileId(url) {
    if (!url || typeof url !== 'string' || !url.includes('drive.google.com') && !url.includes('docs.google.com')) {
      return '';
    }
    if (url.includes('/folders/')) return '';
    const pathMatch = url.match(/\/(?:file\/d|document\/d|spreadsheets\/d|presentation\/d)\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) return pathMatch[1];
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    return idMatch ? idMatch[1] : '';
  }

  // Helper: Upload a single file to Drive via live GAS endpoint
  async uploadFileToDrive(fileBlob, title = '') {
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());
    if (isLive) {
      const base64 = await this.fileToBase64(fileBlob);
      const res = await fetch(this.settings.gasUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'uploadFile',
          fileName: fileBlob.name,
          fileData: base64,
          mimeType: fileBlob.type || 'application/octet-stream',
          title: title || fileBlob.name,
          skipSheetWrite: true
        })
      });

      const data = await res.json();
      if (data.success && data.document) {
        // Clean up temporary row if older GAS deployment created one
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
      throw new Error(data.error || data.message || `อัปโหลดไฟล์ "${fileBlob.name}" ไม่สำเร็จ`);
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

  // Build canonical single attachment entry from URL-only document metadata
  buildAttachmentFromUrl(docData) {
    const rawUrl = (docData.fileUrl || '').trim();
    const driveId = docData.driveFileId || this.extractDriveFileId(rawUrl);
    const isFolder = rawUrl.includes('/folders/');
    return {
      name: docData.fileName || docData.title || 'เอกสารแนบ',
      url: rawUrl,
      downloadUrl: docData.downloadUrl || (driveId && !isFolder ? `https://drive.google.com/uc?export=download&id=${driveId}` : rawUrl),
      previewUrl: docData.previewUrl || (driveId && !isFolder ? `https://drive.google.com/file/d/${driveId}/preview` : rawUrl),
      driveId,
      size: docData.fileSize || '-',
      type: docData.fileType || this.detectFileType(rawUrl || docData.title)
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
      payloadDoc.fileType = docData.fileType || primary.type;
      if (uploadedAttachments.length === 1 && docData.fileType) {
        uploadedAttachments[0] = { ...primary, type: docData.fileType };
      }
      payloadDoc.fileName = primary.name;
      payloadDoc.attachments = uploadedAttachments;
    } else if (payloadDoc.fileUrl && payloadDoc.fileUrl.trim()) {
      const linkAttachment = this.buildAttachmentFromUrl(payloadDoc);
      uploadedAttachments = [linkAttachment];
      payloadDoc.downloadUrl = linkAttachment.downloadUrl;
      payloadDoc.previewUrl = linkAttachment.previewUrl;
      payloadDoc.driveFileId = linkAttachment.driveId;
      payloadDoc.attachments = uploadedAttachments;
    }

    if (isLive) {
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

      if (!response.ok) {
        throw new Error(`เซิร์ฟเวอร์ Google Apps Script ตอบกลับผิดพลาด (HTTP ${response.status})`);
      }

      const result = await response.json();
      if (!result.success || !result.document) {
        throw new Error(result.error || result.message || 'ไม่สามารถบันทึกข้อมูลเอกสารลง Google Sheet ได้');
      }

      if (docData.isEbook) {
        await this.setDocumentEbook(result.document.id, true);
      }

      const finalDoc = this.normalizeDoc({
        ...result.document,
        isEbook: Boolean(docData.isEbook),
        fileType: payloadDoc.fileType || result.document.fileType,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : result.document.attachments
      });
      const currentDocs = this.getLocalDocuments();
      currentDocs.unshift(finalDoc);
      localStorage.setItem(CONFIG.STORAGE_KEY_DOCS, JSON.stringify(currentDocs));
      return { success: true, document: finalDoc, isLive: true };
    }

    // Local addition (Offline / No GAS URL configured)
    const offlineId = 'DOC-' + Date.now();
    if (docData.isEbook) {
      await this.setDocumentEbook(offlineId, true);
    }

    const newDoc = this.normalizeDoc({
      id: offlineId,
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
      academicYear: payloadDoc.academicYear || String(new Date().getFullYear() + 543),
      tags: payloadDoc.tags || '',
      description: payloadDoc.description || '',
      steps: payloadDoc.steps || '',
      downloadCount: 0,
      viewCount: 0,
      isPinned: Boolean(payloadDoc.isPinned),
      isEbook: Boolean(docData.isEbook),
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
  async updateDocument(docData, newFiles = [], existingFiles = null) {
    const filesArray = Array.isArray(newFiles) ? newFiles : (newFiles ? [newFiles] : []);
    const isLive = Boolean(this.settings.gasUrl && this.settings.gasUrl.trim());

    let uploadedAttachments = [];
    if (filesArray.length > 0) {
      for (const file of filesArray) {
        const uploaded = await this.uploadFileToDrive(file, docData.title);
        uploadedAttachments.push(uploaded);
      }
    }

    // Preserve existing attachments when caller only updates metadata (e.g. handleTogglePin)
    const baseExisting = Array.isArray(existingFiles)
      ? existingFiles
      : (Array.isArray(docData.attachments) ? docData.attachments : []);
    let allAttachments = [...baseExisting, ...uploadedAttachments];
    const updatedFields = { ...docData };

    if (allAttachments.length === 0 && docData.fileUrl && docData.fileUrl.trim()) {
      allAttachments = [this.buildAttachmentFromUrl(docData)];
    }

    if (allAttachments.length > 0) {
      const primary = { ...allAttachments[0] };
      const chosenType = docData.fileType || primary.type;
      // If editing a single-file record without uploading new binary, sync the attachment badge type with user's dropdown choice
      if (allAttachments.length === 1 && filesArray.length === 0 && docData.fileType) {
        primary.type = docData.fileType;
        allAttachments = [primary];
      }
      updatedFields.fileUrl = primary.url;
      updatedFields.downloadUrl = primary.downloadUrl;
      updatedFields.previewUrl = primary.previewUrl;
      updatedFields.driveFileId = primary.driveId;
      updatedFields.fileSize = primary.size;
      updatedFields.fileType = chosenType;
      updatedFields.fileName = primary.name;
      updatedFields.attachments = allAttachments;
    } else if (Array.isArray(existingFiles)) {
      updatedFields.attachments = [];
    }

    if (isLive) {
      const response = await fetch(this.settings.gasUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateDoc',
          ...updatedFields,
          attachments: JSON.stringify(allAttachments)
        })
      });

      if (!response.ok) {
        throw new Error(`เซิร์ฟเวอร์ Google Apps Script ตอบกลับผิดพลาด (HTTP ${response.status})`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || result.message || 'ไม่สามารถอัปเดตข้อมูลเอกสารใน Google Sheet ได้');
      }

      if (docData.isEbook !== undefined) {
        await this.setDocumentEbook(docData.id, Boolean(docData.isEbook));
      }

      const finalDoc = this.normalizeDoc(updatedFields);
      this.updateLocalDocument(finalDoc);
      return { success: true, document: finalDoc, isLive: true };
    }

    // Local / Offline fallback update
    if (docData.isEbook !== undefined) {
      await this.setDocumentEbook(docData.id, Boolean(docData.isEbook));
    }
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
      const response = await fetch(this.settings.gasUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteDoc', id })
      });

      if (!response.ok) {
        throw new Error(`เซิร์ฟเวอร์ Google Apps Script ตอบกลับผิดพลาด (HTTP ${response.status})`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || result.message || 'ไม่สามารถลบเอกสารใน Google Sheet ได้');
      }

      if (this.getEbookIdsSet().has(String(id))) {
        this.setDocumentEbook(id, false).catch(() => {});
      }
      this.deleteLocalDocument(id);
      return { success: true, isLive: true };
    }

    if (this.getEbookIdsSet().has(String(id))) {
      this.setDocumentEbook(id, false).catch(() => {});
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
      'ขั้นตอนการดำเนินการ': doc.steps || '-',
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
      if (!Array.isArray(list)) return [];
      const ebookSet = this.getEbookIdsSet();
      const cleaned = this.cleanDocsList(list).map(d => this.normalizeDoc(d, ebookSet));
      return this.applyCustomOrder(cleaned, this.settings?.customDocOrder);
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

  /**
   * Download a single file cleanly (uses CORS-enabled direct blob download for Drive files to preserve filenames and avoid popup blocks, with _blank fallback).
   */
  async downloadSingleFile(file) {
    if (!file) return;
    const rawUrl = file.downloadUrl || file.url || file.fileUrl || '';
    const isNativeDocsEditor = /docs\.google\.com\/(document|spreadsheets|presentation)\/d\//.test(rawUrl);
    const driveId = file.driveId || file.driveFileId || this.extractDriveFileId(rawUrl);
    const fileName = file.name || file.fileName || file.title || 'document';

    if (driveId && !isNativeDocsEditor) {
      try {
        const directUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download`;
        const res = await fetch(directUrl);
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (res.ok && !contentType.includes('text/html')) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
          return;
        }
      } catch (err) {
        console.warn('Direct Drive blob download failed, falling back to tab open:', err);
      }
    }

    const fallbackUrl = rawUrl || (driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : '');
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Download multiple attached files sequentially as individual files (no ZIP extraction needed).
   */
  async downloadMultipleFiles(files = [], onProgress = null) {
    const list = Array.isArray(files) ? files.filter(Boolean) : [];
    for (let i = 0; i < list.length; i++) {
      if (typeof onProgress === 'function') {
        onProgress(i + 1, list.length, list[i]);
      }
      await this.downloadSingleFile(list[i]);
      if (i < list.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
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
