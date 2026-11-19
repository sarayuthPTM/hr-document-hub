import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Download } from 'lucide-react';
import { getFileTypeConfig } from '../utils/fileTypeConfig';

export default function QRCodeModal({ document, onClose, onCopyLink }) {
  const [copied, setCopied] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  useEffect(() => {
    setActiveFileIndex(0);
    setCopied(false);
  }, [document]);

  if (!document) return null;

  const attachments = (Array.isArray(document.attachments) && document.attachments.length > 0)
    ? document.attachments
    : [{
        name: document.fileName || document.title || 'เอกสารแนบ',
        url: document.fileUrl || '',
        downloadUrl: document.downloadUrl || document.fileUrl || '',
        type: document.fileType || 'FILE'
      }];

  const currentFile = attachments[activeFileIndex] || attachments[0] || {};
  const targetUrl = currentFile.downloadUrl || currentFile.url || document.downloadUrl || document.fileUrl || '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}&margin=10`;

  const handleCopy = () => {
    onCopyLink(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const a = window.document.createElement('a');
    a.href = qrImageUrl;
    a.download = `QRCode_${document.docNumber || document.id}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          สแกน QR Code ดาวน์โหลด
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-2">
          ใช้สมาร์ตโฟนหรือ LINE สแกนเพื่อเปิดดู/ดาวน์โหลดเอกสารลงเครื่องทันที
        </p>

        {/* Multi-file QR selector */}
        {attachments.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 w-full">
            {attachments.map((file, idx) => {
              const conf = getFileTypeConfig(file.type);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveFileIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    activeFileIndex === idx
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {conf.label}: {file.name ? file.name.slice(0, 16) : `ไฟล์ ${idx + 1}`}
                </button>
              );
            })}
          </div>
        )}

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-inner mb-4">
          <img
            src={qrImageUrl}
            alt="QR Code"
            className="w-48 h-48 object-contain rounded-xl"
            loading="lazy"
          />
        </div>

        {/* Doc Info */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-full mb-4 text-left">
          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mb-0.5">
            {document.category}
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
            {document.title}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>โหลดรูป QR</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
