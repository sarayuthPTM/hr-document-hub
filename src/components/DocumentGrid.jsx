import React from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Share2, 
  Copy, 
  Check, 
  Star, 
  Trash2, 
  Edit3, 
  Calendar, 
  Users, 
  Tag, 
  FileSpreadsheet, 
  File, 
  Archive,
  QrCode,
  FileCode,
  ExternalLink
} from 'lucide-react';

const FILE_TYPE_CONFIG = {
  PDF: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900/50',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
    icon: FileText
  },
  DOCX: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900/50',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    icon: FileText
  },
  XLSX: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    icon: FileSpreadsheet
  },
  PPTX: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900/50',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    icon: FileText
  },
  ZIP: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-900/50',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    icon: Archive
  },
  DEFAULT: {
    bg: 'bg-slate-50 dark:bg-slate-800/60',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    icon: File
  }
};

export default function DocumentGrid({ 
  documents, 
  isAdmin, 
  onPreview, 
  onDownload, 
  onOpenQR, 
  onCopyLink, 
  onEdit, 
  onDelete, 
  onTogglePin 
}) {
  const [copiedId, setCopiedId] = React.useState(null);

  const handleCopy = (doc) => {
    onCopyLink(doc.fileUrl || doc.downloadUrl);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 my-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
          ไม่พบเอกสารที่ค้นหา
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          ลองปรับคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาเอกสารที่ต้องการ
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-6">
      {documents.map((doc) => {
        const fileConf = FILE_TYPE_CONFIG[doc.fileType] || FILE_TYPE_CONFIG.DEFAULT;
        const IconComponent = fileConf.icon;

        return (
          <div
            key={doc.id}
            className={`group relative bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between card-hover-glow ${
              doc.isPinned ? 'ring-2 ring-teal-500/40 bg-gradient-to-b from-teal-50/30 to-white dark:from-teal-950/20 dark:to-slate-900' : ''
            }`}
          >
            {/* Top Bar: Badges & Admin Actions */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* File Type Badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${fileConf.badge}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    {doc.fileType}
                  </span>

                  {/* Doc Number */}
                  {doc.docNumber && doc.docNumber !== '-' && (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {doc.docNumber}
                    </span>
                  )}

                  {/* Pinned Badge */}
                  {doc.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      แนะนำ
                    </span>
                  )}
                </div>

                {/* Admin Quick Action Buttons */}
                {isAdmin && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => onTogglePin(doc)}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        doc.isPinned ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={doc.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดเอกสารนี้'}
                    >
                      <Star className={`w-3.5 h-3.5 ${doc.isPinned ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => onEdit(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="แก้ไขข้อมูลเอกสาร"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="ลบเอกสาร"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1.5">
                {doc.category}
              </div>

              {/* Title */}
              <h3 
                onClick={() => onPreview(doc)}
                className="font-bold text-base text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 cursor-pointer transition-colors"
                title={doc.title}
              >
                {doc.title}
              </h3>

              {/* Description */}
              {doc.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {doc.description}
                </p>
              )}

              {/* Tags */}
              {doc.tags && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {doc.tags.split(',').slice(0, 3).map((tag, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Meta & Action Buttons */}
            <div>
              {/* Meta row: Audience, Year, Size, Stats */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {doc.targetAudience || 'ทุกคน'}
                  </span>
                  <span>•</span>
                  <span>ปี {doc.academicYear || '2568'}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span title="เปิดดู">{doc.viewCount || 0} วิว</span>
                  <span>•</span>
                  <span title="ดาวน์โหลด">{doc.downloadCount || 0} โหลด</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {/* Preview Button */}
                <button
                  onClick={() => onPreview(doc)}
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>เปิดดูไฟล์</span>
                </button>

                {/* Download Button */}
                <button
                  onClick={() => onDownload(doc)}
                  className="col-span-1 flex items-center justify-center p-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  title="ดาวน์โหลดไฟล์"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </button>

                {/* QR Code / Share Button */}
                <div className="col-span-1 flex items-center gap-1">
                  <button
                    onClick={() => onOpenQR(doc)}
                    className="w-1/2 h-full flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                    title="สร้าง QR Code สแกนผ่านมือถือ"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopy(doc)}
                    className="w-1/2 h-full flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                    title="คัดลอกลิงก์ไฟล์"
                  >
                    {copiedId === doc.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>
        );
      })}
    </div>
  );
}
