import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Link2, 
  FileText, 
  Check, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  File, 
  Star,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { CATEGORIES, TARGET_AUDIENCES, YEARS } from '../config/constants';

export default function AdminAddEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingDoc = null,
  isLive = false 
}) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'link'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    docNumber: '',
    category: 'แบบฟอร์มใบลาและขออนุญาต',
    targetAudience: 'บุคลากรทุกคน',
    academicYear: '2568',
    fileType: 'PDF',
    fileUrl: '',
    tags: '',
    description: '',
    isPinned: false
  });

  useEffect(() => {
    if (editingDoc) {
      setFormData({
        title: editingDoc.title || '',
        docNumber: editingDoc.docNumber || '',
        category: editingDoc.category || 'แบบฟอร์มใบลาและขออนุญาต',
        targetAudience: editingDoc.targetAudience || 'บุคลากรทุกคน',
        academicYear: editingDoc.academicYear || '2568',
        fileType: editingDoc.fileType || 'PDF',
        fileUrl: editingDoc.fileUrl || '',
        tags: editingDoc.tags || '',
        description: editingDoc.description || '',
        isPinned: Boolean(editingDoc.isPinned)
      });
      // In edit mode, default to 'link' if existing fileUrl exists, but both tabs are available
      setMode('link');
      setSelectedFile(null);
    } else {
      setFormData({
        title: '',
        docNumber: '',
        category: 'แบบฟอร์มใบลาและขออนุญาต',
        targetAudience: 'บุคลากรทุกคน',
        academicYear: '2568',
        fileType: 'PDF',
        fileUrl: '',
        tags: '',
        description: '',
        isPinned: false
      });
      setMode('upload');
      setSelectedFile(null);
    }
    setError('');
  }, [editingDoc, isOpen]);

  if (!isOpen) return null;

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    setSelectedFile(file);

    // Auto-detect title if empty
    if (!formData.title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({
        ...prev,
        title: nameWithoutExt
      }));
    }

    // Auto-detect fileType
    const ext = file.name.split('.').pop().toUpperCase();
    let detectedType = 'PDF';
    if (['DOC', 'DOCX'].includes(ext)) detectedType = 'DOCX';
    else if (['XLS', 'XLSX', 'CSV'].includes(ext)) detectedType = 'XLSX';
    else if (['PPT', 'PPTX'].includes(ext)) detectedType = 'PPTX';
    else if (['ZIP', 'RAR', '7Z'].includes(ext)) detectedType = 'ZIP';
    else if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)) detectedType = 'IMAGE';

    setFormData(prev => ({
      ...prev,
      fileType: detectedType
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('กรุณากรอกชื่อเอกสาร');
      return;
    }

    // Validation
    if (!editingDoc) {
      if (mode === 'upload' && !selectedFile && !formData.fileUrl.trim()) {
        setError('กรุณาเลือกไฟล์จากคอมพิวเตอร์ หรือระบุลิงก์เอกสาร');
        return;
      }
      if (mode === 'link' && !formData.fileUrl.trim() && !selectedFile) {
        setError('กรุณากรอกลิงก์ไฟล์เอกสาร หรือเลือกไฟล์จากคอมพิวเตอร์');
        return;
      }
    } else {
      if (!formData.fileUrl.trim() && !selectedFile) {
        setError('กรุณาระบุลิงก์ไฟล์ หรือเลือกไฟล์จากคอมพิวเตอร์');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave(formData, selectedFile);
      onClose();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{editingDoc ? 'แก้ไขข้อมูลเอกสาร' : 'เพิ่มเอกสารงานบุคคลใหม่'}</span>
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ซิงก์ Google Sheets & Drive
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isLive 
                ? 'ไฟล์ที่อัปโหลดจะถูกเก็บเข้าสู่ Google Drive อัตโนมัติ พร้อมอัปเดตฐานข้อมูล' 
                : 'ทำงานในโหมดออฟไลน์/ทดสอบ บันทึกใน LocalStorage'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                mode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>{editingDoc ? 'อัปโหลดไฟล์ใหม่จากคอมพิวเตอร์' : 'อัปโหลดไฟล์จากคอมพิวเตอร์'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                mode === 'link'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>ระบุลิงก์ภายนอก / Google Drive</span>
            </button>
          </div>

          {/* Banner showing current doc file if editing */}
          {editingDoc && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  {editingDoc.fileType || 'FILE'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    ไฟล์เดิมในระบบ: {editingDoc.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {editingDoc.fileSize ? `ขนาด ${editingDoc.fileSize} • ` : ''}
                    {editingDoc.fileUrl || 'ไม่มีลิงก์'}
                  </p>
                </div>
              </div>
              {editingDoc.fileUrl && (
                <a
                  href={editingDoc.previewUrl || editingDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-teal-600 dark:text-teal-400 font-semibold hover:bg-teal-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <span>ดูไฟล์</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Mode Upload: Drag & Drop Zone */}
          {mode === 'upload' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {editingDoc ? 'เลือกไฟล์ใหม่จากคอมพิวเตอร์เพื่อแทนที่ไฟล์เดิม' : 'เลือกหรือลากไฟล์เอกสารมาวางที่นี่'}
                </label>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                  อัปโหลดเข้า Google Drive อัตโนมัติ
                </span>
              </div>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 scale-[0.99]'
                    : selectedFile 
                      ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/10'
                      : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {selectedFile.name}
                          </p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                            ไฟล์ใหม่
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'ไฟล์เอกสาร'} • พร้อมอัปโหลดเข้า Google Drive
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors">
                        เปลี่ยนไฟล์
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="ยกเลิกไฟล์ที่เลือก"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-10 h-10 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      ลากไฟล์มาวางที่นี่ หรือ{' '}
                      <label className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-bold">
                        เลือกไฟล์จากคอมพิวเตอร์
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
                        />
                      </label>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      รองรับ PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), รูปภาพ, ZIP (ระบบจะสร้างลิงก์ดาวน์โหลดให้อัตโนมัติ)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode Link: Link Input + Quick Upload Button */}
          {mode === 'link' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ลิงก์ไฟล์เอกสาร (Google Drive URL หรือ ลิงก์ดาวน์โหลด) <span className="text-rose-500">*</span>
              </label>
              
              <div className="relative">
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/... หรือ URL ไฟล์"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Quick File Uploader Button directly inside/below link field */}
              <div className="p-3 bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-teal-950 dark:text-teal-200 truncate">
                      {selectedFile ? `ไฟล์ที่เลือก: ${selectedFile.name}` : 'หรืออัปโหลดไฟล์จากคอมพิวเตอร์ของคุณ'}
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-400">
                      {selectedFile 
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB • เตรียมอัปโหลดเข้า Google Drive อัตโนมัติ`
                        : 'ไม่ต้องก๊อปลิงก์เอง ระบบจะอัปโหลดเข้า Google Drive ให้โดยตรง'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors"
                      title="ยกเลิกไฟล์ที่เลือก"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{selectedFile ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์จากคอม'}</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อเอกสาร / แบบฟอร์ม <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="เช่น แบบฟอร์มขออนุมัติไปราชการ..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Grid row: Doc Number & File Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                เลขที่เอกสาร / รหัสแบบฟอร์ม
              </label>
              <input
                type="text"
                value={formData.docNumber}
                onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                placeholder="เช่น กบค.01/2568 หรือ คส.02/2568"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ประเภทไฟล์
              </label>
              <select
                value={formData.fileType}
                onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="PDF">PDF (.pdf)</option>
                <option value="DOCX">Word Document (.docx / .doc)</option>
                <option value="XLSX">Excel Spreadsheet (.xlsx / .csv)</option>
                <option value="PPTX">PowerPoint (.pptx)</option>
                <option value="ZIP">Archive (.zip / .rar)</option>
                <option value="IMAGE">Image (.jpg / .png)</option>
              </select>
            </div>
          </div>

          {/* Grid row: Category & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                หมวดหมู่เอกสาร
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                กลุ่มเป้าหมายผู้ใช้
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {TARGET_AUDIENCES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid row: Academic Year & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ปี พ.ศ. / ปีการศึกษา
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="เช่น 2568"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                แท็กคำค้นหา (คั่นด้วยจุลภาค , )
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="เช่น ใบลา, ลาป่วย, ขออนุญาต"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              คำอธิบาย / รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="ระบุวัตถุประสงค์ หรือขั้นตอนการยื่นเอกสารโดยสังเขป..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Pinned Checkbox */}
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
            <label htmlFor="isPinned" className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 cursor-pointer">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>ปักหมุดเอกสารนี้ไว้ด้านบน (แสดงเป็นเอกสารแนะนำ/ยอดนิยม)</span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{selectedFile ? 'กำลังอัปโหลดไฟล์เข้า Google Drive...' : 'กำลังบันทึกข้อมูล...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingDoc ? 'บันทึกการแก้ไข' : 'เพิ่มเอกสาร'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
