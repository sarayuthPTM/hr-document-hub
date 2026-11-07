/**
 * ==============================================================================
 * ระบบรวบรวมเอกสารงานบุคคล (HR Document Hub) - Google Apps Script Backend API
 * โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่
 * ------------------------------------------------------------------------------
 * Google Sheet Database ID: 1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY
 * Google Drive Folder ID:   1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt
 * ==============================================================================
 */

const CONFIG = {
  SHEET_ID: '1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY',
  DRIVE_FOLDER_ID: '1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt',
  PRIMARY_SHEET_NAMES: ['ข้อมูล', 'เอกสารงานบุคคล', 'Sheet1'],
  SETTINGS_SHEET_NAME: 'ตั้งค่าระบบ',
  TIMEZONE: 'Asia/Bangkok',
  DEFAULT_PIN: '2725'
};

// Helper: ค้นหา Sheet แผ่นงานข้อมูลเอกสาร
function getTargetSheet(ss) {
  for (let name of CONFIG.PRIMARY_SHEET_NAMES) {
    const s = ss.getSheetByName(name);
    if (s) return s;
  }
  return ss.getSheets()[0];
}

// Helper: ค้นหาหรือสร้าง Sheet แผ่นงานตั้งค่าระบบ
function getOrCreateSettingsSheet(ss) {
  let s = ss.getSheetByName(CONFIG.SETTINGS_SHEET_NAME);
  if (!s) {
    s = ss.insertSheet(CONFIG.SETTINGS_SHEET_NAME);
    const headers = ['key', 'value', 'description', 'updatedAt'];
    s.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Header style: กรมท่า สวยงาม
    const headerRange = s.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    s.setFrozenRows(1);

    // Initial settings rows
    const initData = [
      ['adminPin', CONFIG.DEFAULT_PIN, 'รหัสผ่านเข้าสู่ระบบผู้ดูแลระบบ (Admin PIN)', new Date().toLocaleString('th-TH')],
      ['appNameTh', 'KBS HR Hub', 'ชื่อระบบ (ภาษาไทย)', new Date().toLocaleString('th-TH')],
      ['appNameEn', 'HR Document Hub', 'ชื่อระบบ (ภาษาอังกฤษ)', new Date().toLocaleString('th-TH')],
      ['schoolName', 'โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่', 'ชื่อสถานศึกษา', new Date().toLocaleString('th-TH')],
      ['departmentName', 'กลุ่มบริหารงานบุคคล', 'ชื่อกลุ่มงาน / ฝ่าย', new Date().toLocaleString('th-TH')],
      ['developer', 'พัฒนาโดย ว่าที่ ร.ต. ศรายุทธ พงค์ทองเมือง', 'ข้อมูลลิขสิทธิ์ / ผู้พัฒนา', new Date().toLocaleString('th-TH')],
      ['tagline', 'พัฒนาระบบเพื่อการบริหารงานบุคคลที่มีประสิทธิภาพ', 'สโลแกนท้ายเว็บ', new Date().toLocaleString('th-TH')]
    ];
    s.getRange(2, 1, initData.length, headers.length).setValues(initData);
  }
  return s;
}

// Response Helper with CORS
function jsonResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    timestamp: new Date().toISOString(),
    ...data
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1. GET Request Handler
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getDocuments';

    if (action === 'test') {
      return jsonResponse({
        success: true,
        message: 'ระบบเชื่อมต่อ Google Apps Script สำเร็จสมบูรณ์!',
        sheetId: CONFIG.SHEET_ID,
        folderId: CONFIG.DRIVE_FOLDER_ID
      });
    }

    if (action === 'init') {
      const result = initDatabaseSheet();
      return jsonResponse(result);
    }

    if (action === 'getSettings') {
      const settings = readSettingsFromSheet();
      return jsonResponse({
        success: true,
        settings: settings
      });
    }

    if (action === 'getDocuments') {
      const docs = getAllDocuments();
      const settings = readSettingsFromSheet();
      return jsonResponse({
        success: true,
        data: docs,
        total: docs.length,
        settings: settings // ส่งรหัสผ่านและการตั้งค่าล่าสุดกลับไปด้วยเสมอ
      });
    }

    return jsonResponse({
      success: false,
      message: 'Unknown action: ' + action
    }, 400);

  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    }, 500);
  }
}

/**
 * 2. POST Request Handler
 */
function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else {
      payload = e.parameter || {};
    }

    const action = payload.action || 'getDocuments';

    if (action === 'uploadFile') {
      return jsonResponse(handleFileUpload(payload));
    }

    if (action === 'addDoc') {
      return jsonResponse(handleAddDocument(payload));
    }

    if (action === 'updateDoc') {
      return jsonResponse(handleUpdateDocument(payload));
    }

    if (action === 'deleteDoc') {
      return jsonResponse(handleDeleteDocument(payload));
    }

    if (action === 'incrementDownload') {
      return jsonResponse(handleIncrementCount(payload.id, 'downloadCount'));
    }

    if (action === 'incrementView') {
      return jsonResponse(handleIncrementCount(payload.id, 'viewCount'));
    }

    // อัปเดตรหัสผ่านหรือการตั้งค่าลง Google Sheet
    if (action === 'updateSettings') {
      return jsonResponse(saveSettingsToSheet(payload.settings));
    }

    if (action === 'initSheet') {
      return jsonResponse(initDatabaseSheet());
    }

    return jsonResponse({
      success: false,
      message: 'Unknown action in POST: ' + action
    }, 400);

  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.toString()
    }, 500);
  }
}

/**
 * อ่านการตั้งค่าและรหัสผ่านจากแผ่นงาน 'ตั้งค่าระบบ'
 */
function readSettingsFromSheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = getOrCreateSettingsSheet(ss);
    const values = sheet.getDataRange().getValues();
    const settings = {};

    for (let i = 1; i < values.length; i++) {
      const key = String(values[i][0]).trim();
      const val = values[i][1];
      if (key) {
        settings[key] = String(val !== undefined && val !== null ? val : '');
      }
    }

    // หากรหัสผ่านว่างในชีต ให้ใช้ DEFAULT_PIN
    if (!settings.adminPin || settings.adminPin.trim() === '') {
      settings.adminPin = CONFIG.DEFAULT_PIN;
    }

    return settings;
  } catch (err) {
    Logger.log('Read settings error: ' + err.toString());
    return { adminPin: CONFIG.DEFAULT_PIN };
  }
}

/**
 * บันทึกการตั้งค่าและรหัสผ่านลงแผ่นงาน 'ตั้งค่าระบบ' ใน Google Sheet
 */
function saveSettingsToSheet(newSettings) {
  try {
    if (!newSettings) return { success: false, message: 'ไม่มีข้อมูลการตั้งค่า' };

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = getOrCreateSettingsSheet(ss);
    const values = sheet.getDataRange().getValues();
    const nowStr = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm:ss');

    const keyRowMap = {};
    for (let i = 1; i < values.length; i++) {
      keyRowMap[String(values[i][0]).trim()] = i + 1; // 1-based index
    }

    // วนลูปอัปเดตแต่ละ key
    Object.keys(newSettings).forEach(key => {
      if (['gasUrl', 'sheetId', 'driveFolderId'].includes(key)) return; // ข้ามฟิลด์เชื่อมต่อระบบ
      
      const val = newSettings[key] !== undefined ? String(newSettings[key]) : '';
      if (keyRowMap[key]) {
        // อัปเดตแถวเดิม
        const row = keyRowMap[key];
        sheet.getRange(row, 2).setValue(val);
        sheet.getRange(row, 4).setValue(nowStr);
      } else {
        // เพิ่มแถวใหม่
        sheet.appendRow([key, val, 'การตั้งค่าระบบ ' + key, nowStr]);
      }
    });

    return {
      success: true,
      message: 'อัปเดตรหัสผ่านและการตั้งค่าลงใน Google Sheet เรียบร้อยแล้ว!'
    };
  } catch (err) {
    return {
      success: false,
      error: 'Save settings error: ' + err.toString()
    };
  }
}

/**
 * 3. Handle File Upload directly to Google Drive Folder
 */
function handleFileUpload(data) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    
    const base64Data = data.fileData.includes('base64,') 
      ? data.fileData.split('base64,')[1] 
      : data.fileData;
      
    const decodedBlob = Utilities.newBlob(
      Utilities.base64Decode(base64Data), 
      data.mimeType || 'application/octet-stream', 
      data.fileName || 'document.pdf'
    );

    const driveFile = folder.createFile(decodedBlob);
    try {
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(shareErr) {
      Logger.log('Set sharing error: ' + shareErr.message);
    }

    const fileUrl = driveFile.getUrl();
    const driveFileId = driveFile.getId();
    const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + driveFileId;
    const previewUrl = 'https://drive.google.com/file/d/' + driveFileId + '/preview';
    const fileSizeFormatted = formatBytes(driveFile.getSize());

    const newDoc = {
      id: 'DOC-' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss'),
      title: data.title || data.fileName,
      docNumber: data.docNumber || '-',
      category: data.category || 'เอกสารทั่วไป',
      fileType: detectFileType(data.fileName),
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      previewUrl: previewUrl,
      driveFileId: driveFileId,
      fileSize: fileSizeFormatted,
      targetAudience: data.targetAudience || 'บุคลากรทุกคน',
      academicYear: data.academicYear || (new Date().getFullYear() + 543).toString(),
      tags: data.tags || '',
      description: data.description || '',
      downloadCount: 0,
      viewCount: 0,
      isPinned: data.isPinned ? true : false,
      status: 'active',
      createdAt: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'),
      updatedAt: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'),
      uploadedBy: data.uploadedBy || 'Admin'
    };

    appendDocumentToSheet(newDoc);

    return {
      success: true,
      message: 'อัปโหลดไฟล์และบันทึกข้อมูลสำเร็จ!',
      document: newDoc
    };

  } catch (err) {
    return {
      success: false,
      error: 'Upload error: ' + err.toString()
    };
  }
}

/**
 * 4. Handle Add Document without file upload
 */
function handleAddDocument(data) {
  try {
    let driveFileId = data.driveFileId || '';
    let previewUrl = data.fileUrl;
    let downloadUrl = data.fileUrl;

    if (data.fileUrl && data.fileUrl.includes('drive.google.com')) {
      const match = data.fileUrl.match(/[-\w]{25,}/);
      if (match) {
        driveFileId = match[0];
        previewUrl = 'https://drive.google.com/file/d/' + driveFileId + '/preview';
        downloadUrl = 'https://drive.google.com/uc?export=download&id=' + driveFileId;
      }
    }

    const newDoc = {
      id: 'DOC-' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss'),
      title: data.title || 'เอกสารไม่มีชื่อ',
      docNumber: data.docNumber || '-',
      category: data.category || 'เอกสารทั่วไป',
      fileType: data.fileType || detectFileType(data.fileUrl || data.title),
      fileUrl: data.fileUrl || '',
      downloadUrl: downloadUrl,
      previewUrl: previewUrl,
      driveFileId: driveFileId,
      fileSize: data.fileSize || '-',
      targetAudience: data.targetAudience || 'บุคลากรทุกคน',
      academicYear: data.academicYear || (new Date().getFullYear() + 543).toString(),
      tags: data.tags || '',
      description: data.description || '',
      downloadCount: 0,
      viewCount: 0,
      isPinned: data.isPinned ? true : false,
      status: 'active',
      createdAt: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'),
      updatedAt: Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'),
      uploadedBy: data.uploadedBy || 'Admin'
    };

    appendDocumentToSheet(newDoc);

    return {
      success: true,
      message: 'เพิ่มเอกสารสำเร็จ!',
      document: newDoc
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 5. Handle Update Document
 */
function handleUpdateDocument(data) {
  try {
    if (!data.id) throw new Error('Missing document ID');
    
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = getTargetSheet(ss);
    if (!sheet) throw new Error('Sheet not found');

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idColIndex = headers.indexOf('id');
    
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idColIndex]) === String(data.id)) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('ไม่พบเอกสารรหัส: ' + data.id);
    }

    const updatedDate = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');
    headers.forEach((key, colIdx) => {
      if (data[key] !== undefined && key !== 'id' && key !== 'createdAt') {
        sheet.getRange(rowIndex, colIdx + 1).setValue(data[key]);
      }
      if (key === 'updatedAt') {
        sheet.getRange(rowIndex, colIdx + 1).setValue(updatedDate);
      }
    });

    return {
      success: true,
      message: 'แก้ไขข้อมูลเอกสารเรียบร้อย!',
      id: data.id
    };

  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 6. Handle Delete Document
 */
function handleDeleteDocument(data) {
  try {
    if (!data.id) throw new Error('Missing document ID');

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = getTargetSheet(ss);
    if (!sheet) throw new Error('Sheet not found');

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idColIndex = headers.indexOf('id');

    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idColIndex]) === String(data.id)) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('ไม่พบเอกสารรหัส: ' + data.id);
    }

    sheet.deleteRow(rowIndex);

    return {
      success: true,
      message: 'ลบเอกสารสำเร็จ!'
    };

  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 7. Increment Download or View Counter
 */
function handleIncrementCount(docId, countField) {
  try {
    if (!docId) return { success: false };
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = getTargetSheet(ss);
    if (!sheet) return { success: false };

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idColIndex = headers.indexOf('id');
    const targetColIndex = headers.indexOf(countField);

    if (idColIndex === -1 || targetColIndex === -1) return { success: false };

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idColIndex]) === String(docId)) {
        const cur = Number(values[i][targetColIndex]) || 0;
        sheet.getRange(i + 1, targetColIndex + 1).setValue(cur + 1);
        return { success: true, newCount: cur + 1 };
      }
    }
    return { success: false };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 8. Read All Documents from Sheet
 */
function getAllDocuments() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = getTargetSheet(ss);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    initDatabaseSheet();
    sheet = getTargetSheet(ss);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const list = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[1]) continue;

    const item = {};
    headers.forEach((h, idx) => {
      item[h] = row[idx];
    });

    item.isPinned = (item.isPinned === true || String(item.isPinned).toUpperCase() === 'TRUE');
    item.downloadCount = Number(item.downloadCount) || 0;
    item.viewCount = Number(item.viewCount) || 0;

    list.push(item);
  }

  list.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return String(b.id).localeCompare(String(a.id));
  });

  return list;
}

/**
 * Append single row to Sheet
 */
function appendDocumentToSheet(doc) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = getTargetSheet(ss);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const row = headers.map(key => {
    return doc[key] !== undefined ? doc[key] : '';
  });

  sheet.appendRow(row);
}

/**
 * 9. Initializer: Auto Create Headers in Blank Sheet
 */
function initDatabaseSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = getTargetSheet(ss);
  
  if (!sheet) {
    sheet = ss.insertSheet('ข้อมูล');
  }

  const headers = [
    'id', 'title', 'docNumber', 'category', 'fileType', 
    'fileUrl', 'downloadUrl', 'previewUrl', 'driveFileId', 'fileSize', 
    'targetAudience', 'academicYear', 'tags', 'description', 
    'downloadCount', 'viewCount', 'isPinned', 'status', 
    'createdAt', 'updatedAt', 'uploadedBy'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0d9488');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // สร้างชีตตั้งค่าระบบคู่กันไปด้วย
  getOrCreateSettingsSheet(ss);

  return {
    success: true,
    message: 'สร้างโครงสร้างตารางและแผ่นงานตั้งค่าระบบสำเร็จเรียบร้อย!'
  };
}

// Utility: File Type Detection
function detectFileType(nameOrUrl) {
  if (!nameOrUrl) return 'FILE';
  const ext = nameOrUrl.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return 'PDF';
  if (['doc', 'docx'].includes(ext)) return 'DOCX';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'XLSX';
  if (['ppt', 'pptx'].includes(ext)) return 'PPTX';
  if (['zip', 'rar', '7z'].includes(ext)) return 'ZIP';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'IMAGE';
  return 'FILE';
}

// Utility: Format File Size
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
