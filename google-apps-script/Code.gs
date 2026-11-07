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
  SHEET_NAME_DOCS: 'เอกสารงานบุคคล',
  SHEET_NAME_LOGS: 'ประวัติการใช้งาน',
  TIMEZONE: 'Asia/Bangkok'
};

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

    if (action === 'getDocuments') {
      const docs = getAllDocuments();
      return jsonResponse({
        success: true,
        data: docs,
        total: docs.length
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
 * 2. POST Request Handler (Add, Upload, Update, Delete)
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
 * 3. Handle File Upload directly to Google Drive Folder
 */
function handleFileUpload(data) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    
    // Decode Base64 data
    const base64Data = data.fileData.includes('base64,') 
      ? data.fileData.split('base64,')[1] 
      : data.fileData;
      
    const decodedBlob = Utilities.newBlob(
      Utilities.base64Decode(base64Data), 
      data.mimeType || 'application/octet-stream', 
      data.fileName || 'document.pdf'
    );

    // Save to Google Drive
    const driveFile = folder.createFile(decodedBlob);
    
    // Set file sharing permission to anyone with link can view
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

    // Prepare Document Record
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

    // Insert into Google Sheet
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
 * 4. Handle Add Document without file upload (External / Existing link)
 */
function handleAddDocument(data) {
  try {
    let driveFileId = data.driveFileId || '';
    let previewUrl = data.fileUrl;
    let downloadUrl = data.fileUrl;

    // Extract Google Drive ID if present
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
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DOCS);
    if (!sheet) throw new Error('Sheet not found');

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idColIndex = headers.indexOf('id');
    
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idColIndex]) === String(data.id)) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('ไม่พบเอกสารรหัส: ' + data.id);
    }

    // Update fields
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
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DOCS);
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
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DOCS);
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
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DOCS);
  
  if (!sheet) {
    // Auto initialize if sheet doesn't exist
    initDatabaseSheet();
    sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DOCS);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const list = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Skip empty rows
    if (!row[0] && !row[1]) continue;

    const item = {};
    headers.forEach((h, idx) => {
      item[h] = row[idx];
    });

    // Format isPinned as boolean
    item.isPinned = (item.isPinned === true || String(item.isPinned).toUpperCase() === 'TRUE');
    item.downloadCount = Number(item.downloadCount) || 0;
    item.viewCount = Number(item.viewCount) || 0;

    list.push(item);
  }

  // Sort: pinned first, then by date descending
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
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DOCS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const row = headers.map(key => {
    return doc[key] !== undefined ? doc[key] : '';
  });

  sheet.appendRow(row);
}

/**
 * 9. Initializer: Auto Create Headers & Starter Data in Blank Sheet
 */
function initDatabaseSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME_DOCS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME_DOCS);
  }

  const headers = [
    'id', 'title', 'docNumber', 'category', 'fileType', 
    'fileUrl', 'downloadUrl', 'previewUrl', 'driveFileId', 'fileSize', 
    'targetAudience', 'academicYear', 'tags', 'description', 
    'downloadCount', 'viewCount', 'isPinned', 'status', 
    'createdAt', 'updatedAt', 'uploadedBy'
  ];

  // Set Headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format Header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0d9488'); // Emerald / Teal
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // If table is newly created, add standard HR Documents
  if (sheet.getLastRow() <= 1) {
    const starterDocs = [
      [
        'DOC-2026-001', 
        'แบบฟอร์มใบลาป่วย ลากิจส่วนตัว และลาคลอดบุตร (ฉบับปรับปรุง 2568)', 
        'กบค.01/2568', 
        'แบบฟอร์มใบลาและขออนุญาต', 
        'PDF', 
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        '',
        '342 KB',
        'บุคลากรทุกคน',
        '2568',
        'ใบลา, ลาป่วย, ลากิจ, แบบฟอร์ม',
        'แบบคำขออนุญาตลาป่วย ลากิจส่วนตัว ตามระเบียบสำนักนายกรัฐมนตรี',
        142, 380, true, 'active',
        '01/01/2568 09:00', '01/01/2568 09:00', 'Admin'
      ],
      [
        'DOC-2026-002', 
        'แบบฟอร์มข้อตกลงในการพัฒนางาน (PA) สำหรับข้าราชการครู ตำแหน่งครู (แบบ วPA 1/ส)', 
        'วPA 1/ส-2568', 
        'การประเมินผลการปฏิบัติงาน (PA)', 
        'DOCX', 
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        '',
        '1.1 MB',
        'ข้าราชการครู',
        '2568',
        'PA, ข้อตกลง, วPA, ประเมิน, ว9',
        'แบบจัดทำข้อตกลงในการพัฒนางาน (Performance Agreement) รอบปีงบประมาณ 2568',
        235, 510, true, 'active',
        '02/01/2568 10:30', '02/01/2568 10:30', 'Admin'
      ],
      [
        'DOC-2026-003', 
        'คำสั่งแต่งตั้งเวรยามและผู้รักษาการณ์ดูแลรักษาความปลอดภัยสถานที่ราชการ', 
        'คส.045/2568', 
        'คำสั่งและประกาศงานบุคคล', 
        'PDF', 
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        '',
        '850 KB',
        'บุคลากรทุกคน',
        '2568',
        'เวรยาม, คำสั่ง, ปลอดภัย, รักษาการณ์',
        'คำสั่งโรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่ เรื่อง การอยู่เวรรักษาการณ์สถานที่ราชการ',
        98, 220, false, 'active',
        '05/01/2568 14:15', '05/01/2568 14:15', 'Admin'
      ],
      [
        'DOC-2026-004', 
        'แบบคำขอหนังสือรับรองเงินเดือนและหนังสือรับรองการปฏิบัติงาน', 
        'กบค.08/2568', 
        'หนังสือรับรองและแบบคำขอทั่วไป', 
        'DOCX', 
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        '',
        '180 KB',
        'บุคลากรทุกคน',
        '2568',
        'หนังสือรับรอง, เงินเดือน, การทำงาน, ยื่นกู้',
        'แบบฟอร์มขอให้ออกหนังสือรับรองเพื่อใช้ประกอบการยื่นกู้หรือทำธุรกรรม',
        189, 410, false, 'active',
        '10/01/2568 11:20', '10/01/2568 11:20', 'Admin'
      ],
      [
        'DOC-2026-005', 
        'คู่มือและเกณฑ์การเลื่อนเงินเดือนข้าราชการครูและบุคลากรทางการศึกษา', 
        'คม.02/2568', 
        'เลื่อนขั้นเงินเดือนและวิทยฐานะ', 
        'PDF', 
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        '',
        '2.4 MB',
        'ข้าราชการครู',
        '2568',
        'เลื่อนเงินเดือน, ฐานเงินเดือน, วิทยฐานะ, ก.ค.ศ.',
        'แนวปฏิบัติและเกณฑ์การคำนวณร้อยละการเลื่อนเงินเดือน รอบที่ 1 และ 2',
        156, 340, true, 'active',
        '15/01/2568 16:00', '15/01/2568 16:00', 'Admin'
      ],
      [
        'DOC-2026-006', 
        'แบบฟอร์มขออนุญาตไปราชการและเข้ารับการอบรมพัฒนาวิชาชีพ', 
        'กบค.03/2568', 
        'แบบฟอร์มใบลาและขออนุญาต', 
        'PDF', 
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID,
        '',
        '275 KB',
        'บุคลากรทุกคน',
        '2568',
        'ไปราชการ, อบรม, สัมมนา, ขออนุมัติ',
        'แบบขออนุมัติเดินทางไปราชการ อบรม สัมมนา หรือศึกษาดูงานภายนอกสถานศึกษา',
        210, 490, false, 'active',
        '18/01/2568 08:45', '18/01/2568 08:45', 'Admin'
      ]
    ];

    sheet.getRange(2, 1, starterDocs.length, headers.length).setValues(starterDocs);
  }

  return {
    success: true,
    message: 'สร้างโครงสร้างตารางและข้อมูลเริ่มต้นใน Google Sheet สำเร็จเรียบร้อย!'
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
