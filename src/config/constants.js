/**
 * System Configurations & Starter Data
 * HR Document Hub - Kanchanaphisek Wittayalai Krabi School
 */

export const CONFIG = {
  APP_NAME: 'KBS HR Docs',
  APP_NAME_TH: 'KBS HR Docs',
  SCHOOL_NAME: 'โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่',
  DEPARTMENT_NAME: 'กลุ่มบริหารงานบุคคล',
  DEVELOPER_NAME: 'พัฒนาโดย ว่าที่ ร.ต. ศรายุทธ พงค์ทองเมือง',
  TAGLINE: 'ระบบรวบรวมเอกสารงานบุคคล โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่',
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

export const INITIAL_DOCUMENTS = [];

