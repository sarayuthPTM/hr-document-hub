import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Eye,
  Loader2,
  FolderDown,
  FileStack
} from 'lucide-react';
import { getFileTypeConfig } from '../utils/fileTypeConfig';

/**
 * Modal allowing users to choose a single attachment (e.g., PDF or Word)
 * or download all attached files at once when a document has multiple files.
 */
export default function DownloadPickerModal({
  document,
  onClose,
  onDownloadFile,
  onDownloadAll,
  onPreviewFile
}) {
  const [downloadingIndex, setDownloadingIndex] = useState(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDownloadingAll && downloadingIndex === null) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isDownloadingAll, downloadingIndex]);

  if (!document) return null;

  const attachments = Array.isArray(document.attachments) ? document.attachments : [];

  const handleSingleClick = async (file, idx) => {
    if (downloadingIndex !== null || isDownloadingAll) return;
    setDownloadingIndex(idx);
    try {
      await onDownloadFile(document, file);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleAllClick = async () => {
    if (downloadingIndex !== null || isDownloadingAll || attachments.length === 0) return;
    setIsDownloadingAll(true);
    setProgressText(`กำลังเตรียมไฟล์ 1/${attachments.length}...`);
    try {
      await onDownloadAll(document, (current, total) => {
        setProgressText(`กำลังดาวน์โหลดไฟล์ ${current}/${total}...`);
      });
    } finally {
      setIsDownloadingAll(false);
      setProgressText('');
    }
  };

  const isBusy = isDownloadingAll || downloadingIndex !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => !isBusy && onClose()}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileStack className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  มี {attachments.length} ไฟล์ในรายการนี้
                </span>
                {document.docNumber && document.docNumber !== '-' && (
                  <span className="text-[11px] font-mono text-slate-500">
                    {document.docNumber}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1 line-clamp-2">
                {document.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                เลือกเปิดดูหรือดาวน์โหลดเฉพาะไฟล์ที่ต้องการ หรือโหลดพร้อมกันทั้งหมดได้
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File List */}
        <div className="p-4 sm:p-5 space-y-2.5 max-h-[55vh] overflow-y-auto">
          {attachments.map((file, idx) => {
            const conf = getFileTypeConfig(file.type);
            const IconComp = conf.icon;
            const isThisDownloading = downloadingIndex === idx;

            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-teal-400/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 ${conf.badge}`}>
                    <IconComp className="w-4 h-4" />
                    <span className="text-[9px] font-extrabold leading-none mt-0.5">{conf.label}</span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                      {file.name || `ไฟล์ที่ ${idx + 1}`}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {conf.fullLabel}
                      {file.size ? ` • ${file.size}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      onClose();
                      onPreviewFile(document, idx);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>เปิดดู</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleSingleClick(file, idx)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isThisDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Download All */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
          >
            ปิด
          </button>

          <button
            type="button"
            disabled={isBusy || attachments.length === 0}
            onClick={handleAllClick}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white shadow-md shadow-teal-600/20 transition-all active:scale-95 disabled:opacity-60"
          >
            {isDownloadingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progressText || 'กำลังดาวน์โหลดทั้งหมด...'}</span>
              </>
            ) : (
              <>
                <FolderDown className="w-4 h-4" />
                <span>ดาวน์โหลดทั้งหมด ({attachments.length} ไฟล์)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
