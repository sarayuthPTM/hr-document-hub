/**
 * System Configurations & Starter Data
 * HR Document Hub - Kanchanaphisek Wittayalai Krabi School
 */

export const CONFIG = {
  APP_NAME: 'HR Document Hub',
  APP_NAME_TH: 'ระบบรวบรวมเอกสารงานบุคคล',
  SCHOOL_NAME: 'โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่',
  DEPARTMENT_NAME: 'กลุ่มบริหารงานบุคคล',
  DEVELOPER_NAME: 'พัฒนาโดย ว่าที่ ร.ต. ศรายุทธ พงค์ทองเมือง',
  TAGLINE: 'พัฒนาระบบเพื่อการบริหารงานบุคคลที่มีประสิทธิภาพ',
  DEFAULT_PIN: '2725',
  
  // Google IDs provided by user
  SHEET_ID: '1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY',
  DRIVE_FOLDER_ID: '1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt',
  
  // Live Google Apps Script Web App Endpoint
  DEFAULT_GAS_URL: 'https://script.google.com/macros/s/AKfycbxCFCfQzF0WcRIHeVmFz2uA_Xg_wVAr5nxypUYnoU6zSI8n3FUvsjrf01vxXF_Zshgk/exec',
  
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/1i_1vctvE4Si6ylObH24ipOyTz2uSY6kXMKGNpd2N5WY/edit?gid=0#gid=0',
  DRIVE_URL: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
  
  // Storage Keys
  STORAGE_KEY_DOCS: 'kbs_hr_docs_data',
  STORAGE_KEY_SETTINGS: 'kbs_hr_settings',
  STORAGE_KEY_ADMIN_AUTH: 'kbs_hr_admin_session',
  STORAGE_KEY_THEME: 'kbs_hr_theme',
};

export const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด', icon: 'FolderKanban', color: 'slate' },
  { id: 'leave', name: 'แบบฟอร์มใบลาและขออนุญาต', icon: 'FileText', color: 'teal' },
  { id: 'pa', name: 'การประเมินผลการปฏิบัติงาน (PA)', icon: 'Award', color: 'indigo' },
  { id: 'salary', name: 'เลื่อนขั้นเงินเดือนและวิทยฐานะ', icon: 'TrendingUp', color: 'emerald' },
  { id: 'order', name: 'คำสั่งและประกาศงานบุคคล', icon: 'Megaphone', color: 'amber' },
  { id: 'cert', name: 'หนังสือรับรองและแบบคำขอทั่วไป', icon: 'FileCheck2', color: 'blue' },
  { id: 'welfare', name: 'ทะเบียนประวัติและสิทธิประโยชน์', icon: 'HeartHandshake', color: 'rose' },
  { id: 'contract', name: 'สัญญาจ้างและบรรจุแต่งตั้ง', icon: 'Briefcase', color: 'cyan' },
  { id: 'guide', name: 'คู่มือและระเบียบแนวปฏิบัติราชการ', icon: 'BookOpen', color: 'violet' }
];

export const TARGET_AUDIENCES = [
  'บุคลากรทุกคน',
  'ข้าราชการครู',
  'ครูอัตราจ้าง / ลูกจ้างชั่วคราว',
  'บุคลากรทางการศึกษา 38 ค.(2)',
  'ผู้บริหารสถานศึกษา'
];

export const YEARS = ['ทั้งหมด', '2569', '2568', '2567', '2566'];

export const INITIAL_DOCUMENTS = [
  {
    id: 'DOC-2026-001',
    title: 'แบบฟอร์มใบลาป่วย ลากิจส่วนตัว และลาคลอดบุตร (ฉบับปรับปรุง 2568)',
    docNumber: 'กบค.01/2568',
    category: 'แบบฟอร์มใบลาและขออนุญาต',
    fileType: 'PDF',
    fileUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    downloadUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    previewUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    driveFileId: '',
    fileSize: '342 KB',
    targetAudience: 'บุคลากรทุกคน',
    academicYear: '2568',
    tags: 'ใบลา, ลาป่วย, ลากิจ, ลาคลอด, แบบฟอร์ม',
    description: 'แบบคำขออนุญาตลาป่วย ลากิจส่วนตัว ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555',
    downloadCount: 142,
    viewCount: 380,
    isPinned: true,
    status: 'active',
    createdAt: '01/01/2568 09:00',
    updatedAt: '01/01/2568 09:00',
    uploadedBy: 'Admin'
  },
  {
    id: 'DOC-2026-002',
    title: 'แบบฟอร์มข้อตกลงในการพัฒนางาน (PA) สำหรับข้าราชการครู ตำแหน่งครู (แบบ วPA 1/ส)',
    docNumber: 'วPA 1/ส-2568',
    category: 'การประเมินผลการปฏิบัติงาน (PA)',
    fileType: 'DOCX',
    fileUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    downloadUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    previewUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    driveFileId: '',
    fileSize: '1.1 MB',
    targetAudience: 'ข้าราชการครู',
    academicYear: '2568',
    tags: 'PA, ข้อตกลง, วPA, ประเมิน, ว9, วิกเตอร์',
    description: 'แบบจัดทำข้อตกลงในการพัฒนางาน (Performance Agreement) ตามเกณฑ์ ว9/2564 ประจำปีงบประมาณ 2568',
    downloadCount: 235,
    viewCount: 510,
    isPinned: true,
    status: 'active',
    createdAt: '02/01/2568 10:30',
    updatedAt: '02/01/2568 10:30',
    uploadedBy: 'Admin'
  },
  {
    id: 'DOC-2026-003',
    title: 'คำสั่งโรงเรียน เรื่อง แต่งตั้งคณะกรรมการและผู้รักษาการณ์ดูแลรักษาความปลอดภัยสถานที่ราชการ',
    docNumber: 'คส.045/2568',
    category: 'คำสั่งและประกาศงานบุคคล',
    fileType: 'PDF',
    fileUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    downloadUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    previewUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    driveFileId: '',
    fileSize: '850 KB',
    targetAudience: 'บุคลากรทุกคน',
    academicYear: '2568',
    tags: 'เวรยาม, คำสั่ง, รักษาความปลอดภัย, เวรกลางวัน, เวรกลางคืน',
    description: 'คำสั่งโรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่ กำหนดหน้าที่และตารางเวรรักษาการณ์สถานที่ราชการ ประจำปี 2568',
    downloadCount: 98,
    viewCount: 220,
    isPinned: false,
    status: 'active',
    createdAt: '05/01/2568 14:15',
    updatedAt: '05/01/2568 14:15',
    uploadedBy: 'Admin'
  },
  {
    id: 'DOC-2026-004',
    title: 'แบบคำขอหนังสือรับรองเงินเดือนและหนังสือรับรองการเป็นบุคลากรสถานศึกษา',
    docNumber: 'กบค.08/2568',
    category: 'หนังสือรับรองและแบบคำขอทั่วไป',
    fileType: 'DOCX',
    fileUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    downloadUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    previewUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    driveFileId: '',
    fileSize: '180 KB',
    targetAudience: 'บุคลากรทุกคน',
    academicYear: '2568',
    tags: 'หนังสือรับรอง, เงินเดือน, การทำงาน, ยื่นกู้สหกรณ์, บัตรเครดิต',
    description: 'แบบฟอร์มคำขอให้ออกหนังสือรับรองรายได้และสถานภาพการทำงานเพื่อใช้ประกอบธุรกรรมการเงิน',
    downloadCount: 189,
    viewCount: 410,
    isPinned: false,
    status: 'active',
    createdAt: '10/01/2568 11:20',
    updatedAt: '10/01/2568 11:20',
    uploadedBy: 'Admin'
  },
  {
    id: 'DOC-2026-005',
    title: 'คู่มือและหลักเกณฑ์การประเมินเพื่อเลื่อนเงินเดือนข้าราชการครู รอบที่ 1 และ 2',
    docNumber: 'คม.02/2568',
    category: 'เลื่อนขั้นเงินเดือนและวิทยฐานะ',
    fileType: 'PDF',
    fileUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    downloadUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    previewUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    driveFileId: '',
    fileSize: '2.4 MB',
    targetAudience: 'ข้าราชการครู',
    academicYear: '2568',
    tags: 'เลื่อนขั้น, เงินเดือน, ว14, ฐานบนล่าง, ร้อยละเงินเดือน, ก.ค.ศ.',
    description: 'หลักเกณฑ์และแนวปฏิบัติการประเมินประสิทธิภาพและประสิทธิผลการปฏิบัติงานเพื่อเลื่อนขั้นเงินเดือน',
    downloadCount: 156,
    viewCount: 340,
    isPinned: true,
    status: 'active',
    createdAt: '15/01/2568 16:00',
    updatedAt: '15/01/2568 16:00',
    uploadedBy: 'Admin'
  },
  {
    id: 'DOC-2026-006',
    title: 'แบบขออนุมัติเดินทางไปราชการ อบรม สัมมนา และพัฒนาวิชาชีพภายนอกสถานศึกษา',
    docNumber: 'กบค.03/2568',
    category: 'แบบฟอร์มใบลาและขออนุญาต',
    fileType: 'PDF',
    fileUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    downloadUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    previewUrl: 'https://drive.google.com/drive/folders/1mKdJUgQ9iEnVsJw-DeWV_NRnkAQsBsAt?usp=sharing',
    driveFileId: '',
    fileSize: '275 KB',
    targetAudience: 'บุคลากรทุกคน',
    academicYear: '2568',
    tags: 'ไปราชการ, อบรม, ประชุม, สัมมนา, ขออนุมัติเดินทาง',
    description: 'แบบฟอร์มขออนุมัติเดินทางไปราชการเพื่อเข้าร่วมการประชุม สัมมนา อบรม หรือนิเทศติดตามงาน',
    downloadCount: 210,
    viewCount: 490,
    isPinned: false,
    status: 'active',
    createdAt: '18/01/2568 08:45',
    updatedAt: '18/01/2568 08:45',
    uploadedBy: 'Admin'
  }
];
