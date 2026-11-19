import React, { useEffect } from 'react';
import {
  X,
  ClipboardList,
  Eye,
  Download,
  CheckCircle2
} from 'lucide-react';

/**
 * Parse multiline text into clean ordered steps, stripping optional manual numbering (e.g. "1.", "2)", "-").
 */
export function parseDocumentSteps(rawSteps) {
  if (!rawSteps || typeof rawSteps !== 'string') return [];
  return rawSteps
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^(?:\d+[.)\s-]+|[-•*]\s+)/, '').trim())
    .filter(Boolean);
}

export default function StepsModal({ document, onClose, onPreview, onDownload }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const steps = parseDocumentSteps(document.steps);
  const attachmentCount = Array.isArray(document.attachments) ? document.attachments.length : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-gradient-to-r from-sky-50/90 via-indigo-50/70 to-white dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-slate-900">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  ขั้นตอนการดำเนินการ ({steps.length} ขั้นตอน)
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
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Body */}
        <div className="p-5 sm:p-6 max-h-[58vh] overflow-y-auto">
          {steps.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              ยังไม่ได้ระบุขั้นตอนการดำเนินการสำหรับเอกสารนี้
            </div>
          ) : (
            <div className="relative space-y-3.5">
              {steps.map((stepText, idx) => {
                const isLast = idx === steps.length - 1;
                return (
                  <div key={idx} className="relative flex items-start gap-3.5">
                    {/* Connecting vertical line */}
                    {!isLast && (
                      <div
                        className="absolute left-4 top-8 bottom-[-14px] w-0.5 bg-gradient-to-b from-sky-300 to-indigo-200 dark:from-sky-800 dark:to-indigo-900"
                        aria-hidden="true"
                      />
                    )}

                    {/* Step Number Circle */}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-white dark:ring-slate-900">
                      {idx + 1}
                    </div>

                    {/* Step Content Box */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-3 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                          {stepText}
                        </p>
                        {isLast && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Shortcut Actions */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            ปิด
          </button>

          <div className="flex items-center gap-2">
            {onPreview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPreview(document);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>เปิดดูเอกสาร</span>
              </button>
            )}

            {onDownload && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDownload(document);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{attachmentCount > 1 ? `เลือกดาวน์โหลด (${attachmentCount})` : 'ดาวน์โหลดแบบฟอร์ม'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
