import { FileText, FileSpreadsheet, Archive, File, Image as ImageIcon } from 'lucide-react';

/**
 * Shared file-type badge styling, icons, and Thai labels across cards, tables, and modals.
 */
export const FILE_TYPE_CONFIG = {
  PDF: {
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    label: 'PDF',
    fullLabel: 'เอกสาร PDF (พร้อมพิมพ์)',
    icon: FileText
  },
  DOCX: {
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    label: 'WORD',
    fullLabel: 'ไฟล์ Word (แก้ไขได้)',
    icon: FileText
  },
  XLSX: {
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    label: 'EXCEL',
    fullLabel: 'ไฟล์ Excel',
    icon: FileSpreadsheet
  },
  PPTX: {
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    label: 'PPT',
    fullLabel: 'ไฟล์ PowerPoint',
    icon: FileText
  },
  ZIP: {
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    label: 'ZIP',
    fullLabel: 'ไฟล์บีบอัด ZIP',
    icon: Archive
  },
  IMAGE: {
    badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    label: 'IMAGE',
    fullLabel: 'ไฟล์รูปภาพ',
    icon: ImageIcon
  },
  DEFAULT: {
    badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    label: 'FILE',
    fullLabel: 'เอกสารแนบ',
    icon: File
  }
};

export function getFileTypeConfig(fileType) {
  const key = String(fileType || '').toUpperCase();
  return FILE_TYPE_CONFIG[key] || FILE_TYPE_CONFIG.DEFAULT;
}

/**
 * Returns unique file types present in a document's attachments (or fallback primary fileType).
 */
export function getDocumentFileTypes(doc) {
  if (!doc) return [];
  if (Array.isArray(doc.attachments) && doc.attachments.length > 0) {
    const unique = [];
    for (const att of doc.attachments) {
      const t = String(att?.type || doc.fileType || 'FILE').toUpperCase();
      if (!unique.includes(t)) unique.push(t);
    }
    return unique;
  }
  return doc.fileType ? [String(doc.fileType).toUpperCase()] : ['FILE'];
}
