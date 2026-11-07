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
  Star 
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
    // Auto-detect title and fileType if empty
    if (!formData.title) {
      // Remove extension for title
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({
        ...prev,
        title: nameWithoutExt
      }));
    }

    const ext = file.name.split('.').pop().toUpperCase();
    let detectedType = 'PDF';
    if (['DOC', 'DOCX'].includes(ext)) detectedType = 'DOCX';
    else if (['XLS', 'XLSX', 'CSV'].includes(ext)) detectedType = 'XLSX';
    else if (['PPT', 'PPTX'].includes(ext)) detectedType = 'PPTX';
    else if (['ZIP', 'RAR', '7Z'].includes(ext)) detectedType = 'ZIP';

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

    if (!editingDoc && mode === 'upload' && !selectedFile) {
      setError('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด');
      return;
    }

    if (!editingDoc && mode === 'link' && !formData.fileUrl.trim()) {
      setError('กรุณากรอกลิงก์ไฟล์เอกสาร');
      return;
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
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingDoc ? 'แก้ไขข้อมูลเอกสาร' : 'เพิ่มเอกสารงานบุคคลใหม่'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isLive ? 'ข้อมูลและไฟล์จะถูกบันทึกลง Google Sheets และ Google Drive อัตโนมัติ' : 'ทำงานในโหมดออฟไลน์/ทดสอบ บันทึกใน LocalStorage'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Mode Switcher (Only when adding new doc) */}
          {!editingDoc && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>อัปโหลดไฟล์เข้า Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'link'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>ระบุลิงก์ภายนอก / Google Drive</span>
              </button>
            </div>
          )}

          {/* Mode Upload: Drag & Drop Zone */}
          {!editingDoc && mode === 'upload' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                เลือกหรือลากไฟล์เอกสารมาวางที่นี่
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 overflow-hidden text-left">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'ไฟล์เอกสาร'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-10 h-10 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      ลากไฟล์มาวางที่นี่ หรือ <label className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer">
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
                      รองรับ PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), ZIP (ขนาดแนะนำไม่เกิน 15 MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode Link: Link Input */}
          {(editingDoc || mode === 'link') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ลิงก์ไฟล์เอกสาร (Google Drive URL หรือ ลิงก์ดาวน์โหลด) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://drive.google.com/file/d/... หรือ URL ไฟล์"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
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
          <div className="pt-2 flex items-center justify-end gap-3">
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
                  <span>กำลังบันทึกข้อมูล...</span>
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
