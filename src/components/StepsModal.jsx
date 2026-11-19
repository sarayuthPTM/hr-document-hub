import React, { useEffect, useState } from 'react';
import {
  X,
  ClipboardList,
  Eye,
  Download,
  CheckCircle2,
  FileCheck2,
  Check
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

/**
 * Parse multiline description / preparation checklist into structured lines.
 */
export function parsePreparationLines(rawDesc) {
  if (!rawDesc || typeof rawDesc !== 'string') return [];
  return rawDesc
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const isSectionHeader = /ดังนี้\s*:?$/.test(line);
      const isCaseLine = /^[-•*]?\s*กรณี/.test(line);
      const cleanText = line.replace(/^[-•*]\s+/, '').trim();
      return { text: cleanText, isSectionHeader, isCaseLine };
    });
}

export default function StepsModal({ document, onClose, onPreview, onDownload }) {
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    setCheckedItems({});
  }, [document]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const steps = parseDocumentSteps(document.steps);
  const prepLines = parsePreparationLines(document.description);
  const checkableIndices = prepLines.map((item, i) => (!item.isSectionHeader ? i : -1)).filter((i) => i !== -1);
  const checkedCount = checkableIndices.filter((i) => checkedItems[i]).length;

  const hasSteps = steps.length > 0;
  const hasPrep = prepLines.length > 0;
  const attachmentCount = Array.isArray(document.attachments) ? document.attachments.length : 1;

  const toggleItem = (idx) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  let headerBadgeText = 'คำแนะนำเอกสาร';
  if (hasSteps && hasPrep) {
    headerBadgeText = 'ขั้นตอน & เอกสารที่ต้องเตรียม';
  } else if (hasSteps) {
    headerBadgeText = `ขั้นตอนการดำเนินการ (${steps.length} ขั้นตอน)`;
  } else if (hasPrep) {
    headerBadgeText = 'เอกสารที่ต้องเตรียม & รายละเอียด';
  }

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
                  {headerBadgeText}
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

        {/* Scrollable Body: Section 1 (Documents Checklist) + Section 2 (Timeline Steps) */}
        <div className="p-5 sm:p-6 max-h-[62vh] overflow-y-auto space-y-5">
          {/* Section 1: Preparation / Required Documents Checklist */}
          {hasPrep && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>เอกสารที่ต้องเตรียม / รายละเอียด</span>
                </h4>
                {checkableIndices.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    เช็กแล้ว {checkedCount}/{checkableIndices.length}
                  </span>
                )}
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-3 sm:p-3.5 space-y-1.5">
                {prepLines.map((item, idx) => {
                  if (item.isSectionHeader) {
                    return (
                      <p key={idx} className="text-xs font-bold text-amber-900 dark:text-amber-200 pt-1 pb-0.5 px-1">
                        {item.text}
                      </p>
                    );
                  }

                  const isChecked = Boolean(checkedItems[idx]);
                  const colonIdx = item.isCaseLine ? item.text.indexOf(':') : -1;
                  const casePrefix = colonIdx !== -1 ? item.text.slice(0, colonIdx + 1) : '';
                  const caseRest = colonIdx !== -1 ? item.text.slice(colonIdx + 1).trim() : item.text;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleItem(idx)}
                      className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-xl transition-all border ${
                        isChecked
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70'
                          : 'bg-white/90 dark:bg-slate-900/80 border-amber-100 dark:border-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm leading-relaxed ${
                          isChecked
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {casePrefix && (
                          <strong className="text-teal-700 dark:text-teal-300 font-semibold mr-1">
                            {casePrefix}
                          </strong>
                        )}
                        <span>{caseRest}</span>
                      </span>
                    </button>
                  );
                })}
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 px-1 pt-0.5">
                  💡 สามารถแตะที่รายการเพื่อติ๊กเช็กเอกสารที่เตรียมครบแล้วได้ทันที
                </p>
              </div>
            </div>
          )}

          {/* Section 2: Workflow Steps Timeline */}
          {hasSteps && (
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>ขั้นตอนการดำเนินการ ({steps.length} ขั้นตอน)</span>
              </h4>

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
            </div>
          )}

          {!hasSteps && !hasPrep && (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              ยังไม่ได้ระบุขั้นตอนหรือรายละเอียดสำหรับเอกสารนี้
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
