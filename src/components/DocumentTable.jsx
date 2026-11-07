import React from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Copy, 
  Check, 
  QrCode, 
  Star, 
  Edit3, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';

export default function DocumentTable({ 
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
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden my-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-4 px-4 w-12 text-center">#</th>
              <th className="py-4 px-4">เลขที่/รหัส</th>
              <th className="py-4 px-4">ชื่อเอกสาร / รายละเอียด</th>
              <th className="py-4 px-4">หมวดหมู่</th>
              <th className="py-4 px-4 text-center">ประเภท</th>
              <th className="py-4 px-4">กลุ่มเป้าหมาย</th>
              <th className="py-4 px-4 text-center">ปี พ.ศ.</th>
              <th className="py-4 px-4 text-center">ยอดโหลด</th>
              <th className="py-4 px-4 text-right">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {documents.map((doc, idx) => (
              <tr 
                key={doc.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
              >
                {/* Index */}
                <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                  {doc.isPinned ? (
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500 mx-auto" />
                  ) : (
                    idx + 1
                  )}
                </td>

                {/* Doc Number */}
                <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {doc.docNumber || '-'}
                </td>

                {/* Title */}
                <td className="py-3.5 px-4">
                  <div 
                    onClick={() => onPreview(doc)}
                    className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors max-w-md line-clamp-1"
                  >
                    {doc.title}
                  </div>
                  {doc.description && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                      {doc.description}
                    </div>
                  )}
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 text-xs font-medium text-teal-600 dark:text-teal-400 whitespace-nowrap">
                  {doc.category}
                </td>

                {/* File Type */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {doc.fileType}
                  </span>
                </td>

                {/* Target Audience */}
                <td className="py-3.5 px-4 text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                  {doc.targetAudience || 'ทุกคน'}
                </td>

                {/* Year */}
                <td className="py-3.5 px-4 text-center text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                  {doc.academicYear || '-'}
                </td>

                {/* Downloads */}
                <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {doc.downloadCount || 0}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onPreview(doc)}
                      className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                      title="เปิดดูตัวอย่างไฟล์"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownload(doc)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="ดาวน์โหลดไฟล์"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenQR(doc)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="สร้าง QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(doc)}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="คัดลอกลิงก์"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => onEdit(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="แก้ไขเอกสาร"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="ลบเอกสาร"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
