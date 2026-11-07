import React, { useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  Share2, 
  Calendar, 
  Users 
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

  // Determine embed preview URL
  let previewUrl = document.previewUrl || document.fileUrl;
  if (previewUrl && previewUrl.includes('drive.google.com')) {
    if (previewUrl.includes('/view')) {
      previewUrl = previewUrl.replace('/view', '/preview');
    } else if (!previewUrl.includes('/preview') && document.driveFileId) {
      previewUrl = `https://drive.google.com/file/d/${document.driveFileId}/preview`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[92vh] max-h-[850px] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 uppercase">
                  {document.fileType}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            <a
              href={document.fileUrl || document.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink className="w-4 h-4" />
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

        {/* Viewer Area */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden relative">
          {previewUrl && (previewUrl.includes('drive.google.com') || previewUrl.endsWith('.pdf')) ? (
            <iframe
              src={previewUrl}
              title={document.title}
              className="w-full h-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white shadow-inner"
              allow="autoplay"
            />
          ) : (
            <div className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 max-w-lg">
                {document.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                ไฟล์ประเภท {document.fileType} รองรับการดาวน์โหลดหรือเปิดผ่าน Google Drive / แอปพลิเคชันในเครื่อง
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
                  href={document.fileUrl}
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
