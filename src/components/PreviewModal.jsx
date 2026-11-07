import React, { useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  FolderOpen,
  AlertTriangle,
  Info,
  Calendar, 
  Users,
  Eye,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';

export default function PreviewModal({ document, onClose, onDownload, onCopyLink }) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const handleCopy = () => {
    onCopyLink(document.fileUrl || document.downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawUrl = document.previewUrl || document.fileUrl || document.downloadUrl || '';
  const isDriveFolder = rawUrl.includes('/folders/') || rawUrl.includes('drive.google.com/drive/u/');
  
  // Extract Google Drive File ID if present
  let driveId = document.driveFileId;
  if (!driveId && rawUrl.includes('drive.google.com')) {
    const match = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) driveId = match[1];
  }

  // Determine embed preview URL (Only for actual files, NEVER for folders)
  let embedUrl = null;
  if (driveId) {
    embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
  } else if (!isDriveFolder && rawUrl.includes('/file/d/')) {
    embedUrl = rawUrl.replace('/view', '/preview');
    if (!embedUrl.includes('/preview')) {
      embedUrl = embedUrl.replace(/\?usp=.*$/, '') + '/preview';
    }
  } else if (!isDriveFolder && (rawUrl.endsWith('.pdf') || rawUrl.includes('.pdf?'))) {
    embedUrl = rawUrl;
  } else if (!isDriveFolder && (rawUrl.endsWith('.docx') || rawUrl.endsWith('.doc') || rawUrl.endsWith('.xlsx') || rawUrl.endsWith('.pptx'))) {
    embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[92vh] max-h-[850px] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              {isDriveFolder ? <FolderOpen className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 uppercase">
                  {isDriveFolder ? 'GOOGLE DRIVE' : document.fileType}
                </span>
                {document.docNumber && document.docNumber !== '-' && (
                  <span className="text-xs font-mono font-medium text-slate-500">
                    {document.docNumber}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate" title={document.title}>
                {document.title}
              </h2>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onDownload(document)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            <a
              href={document.fileUrl || document.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-semibold"
              title="เปิดดูในแท็บใหม่"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">เปิดแท็บใหม่</span>
            </a>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              title="คัดลอกลิงก์"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Bar for Viewer */}
        <div className="bg-teal-50 dark:bg-teal-950/40 border-b border-teal-100 dark:border-teal-900/40 px-4 py-2 flex items-center justify-between text-[11px] text-teal-800 dark:text-teal-300">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-teal-600 dark:text-teal-400" />
            <span className="truncate">
              {isDriveFolder 
                ? 'เอกสารนี้อยู่ในโฟลเดอร์ Google Drive รวม สามารถกดปุ่มเปิดดูโฟลเดอร์ได้โดยตรง'
                : 'หากตัวอย่างเอกสารไม่แสดงผล กรุณากดปุ่ม "เปิดแท็บใหม่" หรือ "ดาวน์โหลด" ที่มุมบนขวา'}
            </span>
          </div>
          <a
            href={document.fileUrl || document.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-shrink-0 font-bold underline hover:text-teal-950 dark:hover:text-white ml-2"
          >
            เปิดลิงก์โดยตรง ↗
          </a>
        </div>

        {/* Viewer Body Area */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden relative">
          
          {/* Case 1: Embed File iframe (Only when valid embedUrl exists) */}
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={document.title}
              className="w-full h-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white shadow-inner"
              allow="autoplay"
            />
          ) : isDriveFolder ? (
            /* Case 2: Folder Link (Never iframe a folder to avoid Google 403 error) */
            <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 shadow-sm ring-4 ring-teal-500/10">
                <FolderOpen className="w-10 h-10" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 mb-2">
                โฟลเดอร์ Google Drive รวม
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 max-w-lg">
                {document.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                เอกสารนี้เชื่อมต่อกับโฟลเดอร์ Google Drive กลางของกลุ่มบริหารงานบุคคล (Google ไม่อนุญาตให้เปิดโฟลเดอร์แบบฝังในหน้าเว็บ) 
                กรุณาคลิกปุ่มด้านล่างเพื่อเปิดโฟลเดอร์โดยตรง
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={document.fileUrl || document.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>เปิดโฟลเดอร์ใน Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => onDownload(document)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด / ลิงก์</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-6 max-w-sm">
                💡 สำหรับแอดมิน: สามารถกดปุ่มแก้ไข (รูปดินสอ) เพื่ออัปโหลดไฟล์เอกสารตัวจริง (.pdf, .docx) จากคอมพิวเตอร์เพื่อแสดงตัวอย่างได้โดยตรง
              </p>
            </div>
          ) : (
            /* Case 3: Other File Types without direct iframe */
            <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 max-w-lg">
                {document.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                ไฟล์ประเภท {document.fileType} รองรับการดาวน์โหลดหรือเปิดผ่าน Google Drive / แอปพลิเคชันในเครื่องของคุณ
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onDownload(document)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ทันที</span>
                </button>
                <a
                  href={document.fileUrl || document.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>เปิดดูใน Google Drive</span>
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Footer Meta */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span>หมวดหมู่: <strong className="text-slate-700 dark:text-slate-300">{document.category}</strong></span>
            <span>ขนาดไฟล์: <strong className="text-slate-700 dark:text-slate-300">{document.fileSize || '-'}</strong></span>
            <span>กลุ่มเป้าหมาย: <strong className="text-slate-700 dark:text-slate-300">{document.targetAudience}</strong></span>
          </div>
          <div>
            <span>บันทึกเมื่อ: {document.createdAt || '-'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
