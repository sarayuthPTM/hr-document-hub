import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Copy, 
  Check, 
  Star, 
  Trash2, 
  Edit3, 
  Users, 
  FileSpreadsheet, 
  File, 
  Archive,
  QrCode,
  Flame,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  GripVertical
} from 'lucide-react';

const FILE_TYPE_CONFIG = {
  PDF: {
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: FileText
  },
  DOCX: {
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: FileText
  },
  XLSX: {
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: FileSpreadsheet
  },
  PPTX: {
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: FileText
  },
  ZIP: {
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    icon: Archive
  },
  DEFAULT: {
    badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
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
  onTogglePin,
  favorites = [],
  onToggleFavorite,
  onReorder,
  layoutMode = 'grid' // 'grid' | 'slider'
}) {
  const [copiedId, setCopiedId] = useState(null);
  const sliderRef = useRef(null);

  // Drag-and-Drop Reorder State
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Mouse Drag to Scroll (in slider mode only)
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDraggedScroll, setHasDraggedScroll] = useState(false);

  // Drag & Drop handlers for reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    if (onReorder) {
      onReorder(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Slider scroll handlers
  const handleMouseDown = (e) => {
    if (layoutMode !== 'slider' || !sliderRef.current) return;
    // Don't scroll if user is dragging by the grip handle
    if (e.target.closest('.drag-handle')) return;
    setIsDown(true);
    setHasDraggedScroll(false);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
    setTimeout(() => setHasDraggedScroll(false), 80);
  };

  const handleMouseMove = (e) => {
    if (!isDown || !sliderRef.current || layoutMode !== 'slider') return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setHasDraggedScroll(true);
    }
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCopy = (doc) => {
    onCopyLink(doc.fileUrl || doc.downloadUrl);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 my-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          ไม่พบเอกสารในหมวดนี้
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          ลองเลือกหมวดหมู่อื่น หรือปรับคำค้นหา
        </p>
      </div>
    );
  }

  // Render Card Component
  const renderCard = (doc, idx) => {
    const fileConf = FILE_TYPE_CONFIG[doc.fileType] || FILE_TYPE_CONFIG.DEFAULT;
    const IconComponent = fileConf.icon;
    const isFav = favorites.includes(doc.id);
    const isPopular = (doc.downloadCount || 0) >= 150;
    const isBeingDragged = draggedIndex === idx;
    const isDropTarget = dragOverIndex === idx && draggedIndex !== idx;

    return (
      <div
        key={doc.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, idx)}
        onDragOver={(e) => handleDragOver(e, idx)}
        onDrop={(e) => handleDrop(e, idx)}
        onDragEnd={handleDragEnd}
        className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between cursor-grab active:cursor-grabbing ${
          layoutMode === 'slider' ? 'w-[295px] flex-shrink-0 select-none' : 'w-full'
        } ${
          isBeingDragged 
            ? 'opacity-40 scale-95 border-dashed border-2 border-teal-500 bg-teal-50/30' 
            : isDropTarget
            ? 'ring-2 ring-teal-500 border-teal-500 scale-[1.02] shadow-xl'
            : doc.isPinned 
            ? 'border-teal-300 dark:border-teal-800/80 shadow-sm ring-1 ring-teal-500/30 bg-gradient-to-b from-teal-50/20 to-white dark:from-teal-950/20 dark:to-slate-900' 
            : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-400/80'
        }`}
      >
        {/* Top Badges & Drag Grip Handle */}
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              
              {/* Drag Handle Icon */}
              <div 
                className="drag-handle p-1 -ml-1 text-slate-300 hover:text-teal-600 dark:text-slate-600 dark:hover:text-teal-400 cursor-grab active:cursor-grabbing transition-colors rounded"
                title="คลิกค้างแล้วลากเพื่อสลับลำดับการ์ด (อยู่ก่อน/อยู่หลัง)"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              {/* File Type */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${fileConf.badge}`}>
                <IconComponent className="w-3 h-3" />
                {doc.fileType}
              </span>

              {/* Multi-file badge */}
              {doc.attachments && doc.attachments.length > 1 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  +{doc.attachments.length} ไฟล์
                </span>
              )}

              {/* Doc Number */}
              {doc.docNumber && doc.docNumber !== '-' && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {doc.docNumber}
                </span>
              )}

              {/* Pinned Badge */}
              {doc.isPinned && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  แนะนำ
                </span>
              )}

              {/* Popular Badge */}
              {isPopular && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                  ฮิต
                </span>
              )}
            </div>

            {/* Favorite / Bookmark Button */}
            <button
              type="button"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(doc.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isFav 
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' 
                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isFav ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Category */}
          <div className="text-[11px] font-medium text-teal-600 dark:text-teal-400 mb-1 truncate">
            {doc.category}
          </div>

          {/* Title */}
          <h3 
            onClick={() => {
              if (!hasDraggedScroll) onPreview(doc);
            }}
            className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 mb-1.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 cursor-pointer transition-colors leading-snug"
            title={doc.title}
          >
            {doc.title}
          </h3>

          {/* Description */}
          {doc.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2 leading-relaxed">
              {doc.description}
            </p>
          )}

          {/* Tags */}
          {doc.tags && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {doc.tags.split(',').slice(0, 2).map((tag, i) => (
                <span 
                  key={i} 
                  className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Meta & Actions */}
        <div>
          {/* Metadata row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 mb-2">
            <span className="flex items-center gap-1 truncate max-w-[140px]">
              <Users className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{doc.targetAudience || 'ทุกคน'}</span>
            </span>
            <div className="flex items-center gap-1.5 font-medium flex-shrink-0">
              <span>{doc.downloadCount || 0} โหลด</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5" draggable={false}>
            {/* Preview */}
            <button
              type="button"
              onClick={() => {
                if (!hasDraggedScroll) onPreview(doc);
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-200/80 dark:border-teal-800 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>เปิดดู</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={() => {
                if (!hasDraggedScroll) onDownload(doc);
              }}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              title="ดาวน์โหลดไฟล์"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </button>

            {/* QR Code */}
            <button
              type="button"
              onClick={() => {
                if (!hasDraggedScroll) onOpenQR(doc);
              }}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="QR Code ดาวน์โหลดผ่านมือถือ"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={() => {
                if (!hasDraggedScroll) handleCopy(doc);
              }}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="คัดลอกลิงก์ไฟล์"
            >
              {copiedId === doc.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Admin Buttons */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(doc)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                  title="แก้ไข"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(doc)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="ลบ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-2 my-2">
      {/* Drag & Reorder Instruction Hint */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1">
        <span className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-teal-600" />
          <span>สามารถ<strong>คลิกค้างแล้วลากการ์ด</strong> เพื่อสลับลำดับก่อน-หลังได้ทันที 🔄</span>
        </span>

        {layoutMode === 'slider' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollSlider('left')}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 shadow-xs"
              title="เลื่อนซ้าย"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollSlider('right')}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 shadow-xs"
              title="เลื่อนขวา"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Presentation Mode: Grid vs Slider */}
      {layoutMode === 'slider' ? (
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none transition-all ${
            isDown ? 'cursor-grabbing' : ''
          }`}
          style={{ scrollBehavior: isDown ? 'auto' : 'smooth' }}
        >
          {documents.map((doc, idx) => renderCard(doc, idx))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-3 pt-1">
          {documents.map((doc, idx) => renderCard(doc, idx))}
        </div>
      )}
    </div>
  );
}
