import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  FileText, 
  LayoutGrid, 
  List, 
  Filter, 
  RotateCw, 
  PlusCircle, 
  Calendar, 
  Users, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

import { CONFIG, CATEGORIES, YEARS, TARGET_AUDIENCES } from './config/constants';
import { apiService } from './services/apiService';

import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import DocumentGrid from './components/DocumentGrid';
import DocumentTable from './components/DocumentTable';
import PreviewModal from './components/PreviewModal';
import QRCodeModal from './components/QRCodeModal';
import AdminLoginModal from './components/AdminLoginModal';
import AdminAddEditModal from './components/AdminAddEditModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import Toast from './components/Toast';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY_THEME);
    return saved ? saved === 'true' : false;
  });

  // Auth state
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem(CONFIG.STORAGE_KEY_ADMIN_AUTH) === 'true';
  });

  // Settings & Status
  const [settings, setSettings] = useState(() => apiService.loadSettings());
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Documents
  const [documents, setDocuments] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
  const [selectedAudience, setSelectedAudience] = useState('ทั้งหมด');
  const [selectedFileType, setSelectedFileType] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('pinned'); // 'pinned' | 'newest' | 'downloads' | 'title'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [qrDoc, setQrDoc] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Sync dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(CONFIG.STORAGE_KEY_THEME, darkMode.toString());
  }, [darkMode]);

  // Load documents on mount
  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getDocuments();
      setDocuments(res.data);
      setIsLive(res.isLive);
      if (res.isLive) {
        showToast('เชื่อมต่อฐานข้อมูล Google Sheets สำเร็จ', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('ไม่สามารถเชื่อมต่อ Google Sheets ได้ ใช้ข้อมูลแคช', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Auth Handlers
  const handleLoginSuccess = () => {
    setIsAdmin(true);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
    showToast('เข้าสู่ระบบผู้ดูแลระบบสำเร็จ', 'success');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem(CONFIG.STORAGE_KEY_ADMIN_AUTH);
    showToast('ออกจากระบบแอดมินแล้ว', 'info');
  };

  // Add & Edit Handlers
  const handleOpenAdd = () => {
    setEditingDoc(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setIsAddEditOpen(true);
  };

  const handleSaveDoc = async (formData, fileBlob) => {
    if (editingDoc) {
      // Edit
      const res = await apiService.updateDocument({
        ...editingDoc,
        ...formData
      });
      showToast('แก้ไขข้อมูลเอกสารเรียบร้อย', 'success');
      loadDocs();
    } else {
      // Add
      const res = await apiService.addDocument(formData, fileBlob);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      showToast('เพิ่มเอกสารใหม่สำเร็จ', 'success');
      loadDocs();
    }
  };

  const handleDeleteDoc = async (doc) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${doc.title}"?`)) {
      await apiService.deleteDocument(doc.id);
      showToast('ลบเอกสารสำเร็จ', 'info');
      loadDocs();
    }
  };

  const handleTogglePin = async (doc) => {
    const updated = { ...doc, isPinned: !doc.isPinned };
    await apiService.updateDocument(updated);
    showToast(updated.isPinned ? 'ปักหมุดเอกสารเด่นแล้ว' : 'ยกเลิกการปักหมุดแล้ว', 'success');
    loadDocs();
  };

  // Actions
  const handleDownload = (doc) => {
    apiService.incrementDownload(doc.id);
    const link = doc.downloadUrl || doc.fileUrl;
    window.open(link, '_blank');
    // update local count
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d));
  };

  const handlePreview = (doc) => {
    apiService.incrementView(doc.id);
    setPreviewDoc(doc);
    // update local view count
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, viewCount: (d.viewCount || 0) + 1 } : d));
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    showToast('คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว', 'success');
  };

  // Settings Handlers
  const handleSaveSettings = (newSettings) => {
    const saved = apiService.saveSettings(newSettings);
    setSettings(saved);
    showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว', 'success');
    loadDocs();
  };

  // Category Counts Calculation
  const categoryCounts = useMemo(() => {
    const counts = {};
    documents.forEach(doc => {
      const cat = doc.category || 'เอกสารทั่วไป';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Key Metrics
  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const totalDownloads = documents.reduce((sum, d) => sum + (Number(d.downloadCount) || 0), 0);
    const totalViews = documents.reduce((sum, d) => sum + (Number(d.viewCount) || 0), 0);
    return { totalDocs, totalDownloads, totalViews };
  }, [documents]);

  // Filtering & Sorting
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchDocNum = (doc.docNumber || '').toLowerCase().includes(q);
        const matchTags = (doc.tags || '').toLowerCase().includes(q);
        const matchDesc = (doc.description || '').toLowerCase().includes(q);
        const matchCat = (doc.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDocNum && !matchTags && !matchDesc && !matchCat) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'ทั้งหมด' && doc.category !== selectedCategory) {
        return false;
      }

      // Year
      if (selectedYear !== 'ทั้งหมด' && String(doc.academicYear) !== String(selectedYear)) {
        return false;
      }

      // Target Audience
      if (selectedAudience !== 'ทั้งหมด' && doc.targetAudience !== selectedAudience) {
        return false;
      }

      // File Type
      if (selectedFileType !== 'ทั้งหมด' && doc.fileType !== selectedFileType) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return String(b.id).localeCompare(String(a.id));
      }
      if (sortBy === 'newest') {
        return String(b.id).localeCompare(String(a.id));
      }
      if (sortBy === 'downloads') {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '', 'th');
      }
      return 0;
    });
  }, [documents, searchQuery, selectedCategory, selectedYear, selectedAudience, selectedFileType, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors selection:bg-teal-500 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isAdmin={isAdmin}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenAdd={handleOpenAdd}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLive={isLive}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        
        {/* Hero Banner & Search */}
        <HeroBanner
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          stats={stats}
          categoryCounts={categoryCounts}
        />

        {/* Toolbar & Filter Bar */}
        <div className="mt-8 mb-4 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
          
          {/* Left filters: Year, Target Audience, File Type */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            
            {/* Year Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
              >
                <option value="ทั้งหมด">ปี พ.ศ. (ทั้งหมด)</option>
                {YEARS.filter(y => y !== 'ทั้งหมด').map(y => (
                  <option key={y} value={y}>พ.ศ. {y}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Target Audience Dropdown */}
            <div className="relative">
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
              >
                <option value="ทั้งหมด">กลุ่มเป้าหมาย (ทั้งหมด)</option>
                {TARGET_AUDIENCES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* File Type Dropdown */}
            <div className="relative">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
              >
                <option value="ทั้งหมด">ประเภทไฟล์ (ทั้งหมด)</option>
                <option value="PDF">PDF</option>
                <option value="DOCX">Word (DOCX)</option>
                <option value="XLSX">Excel (XLSX)</option>
                <option value="PPTX">PowerPoint (PPTX)</option>
                <option value="ZIP">ZIP</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Filter Button */}
            {(selectedCategory !== 'ทั้งหมด' || selectedYear !== 'ทั้งหมด' || selectedAudience !== 'ทั้งหมด' || selectedFileType !== 'ทั้งหมด' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('ทั้งหมด');
                  setSelectedYear('ทั้งหมด');
                  setSelectedAudience('ทั้งหมด');
                  setSelectedFileType('ทั้งหมด');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1.5 hover:underline"
              >
                ล้างตัวกรอง
              </button>
            )}

          </div>

          {/* Right controls: Sort, Refresh, View Mode */}
          <div className="flex items-center gap-2">
            
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="pinned">เรียงตาม: แนะนำ / ปักหมุด</option>
                <option value="newest">เรียงตาม: เอกสารล่าสุด</option>
                <option value="downloads">เรียงตาม: ยอดดาวน์โหลดสูงสุด</option>
                <option value="title">เรียงตาม: ชื่อ ก-ฮ</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadDocs}
              disabled={isLoading}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองแบบการ์ด"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองแบบตาราง"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 mb-2 font-medium">
          <span>พบเอกสารทั้งหมด <strong>{filteredDocuments.length}</strong> รายการ</span>
          {isAdmin && (
            <span className="text-teal-600 dark:text-teal-400 font-semibold">
              โหมดผู้ดูแลระบบ: คุณสามารถเพิ่ม แก้ไข และลบเอกสารได้
            </span>
          )}
        </div>

        {/* Document Presentation (Grid or Table) */}
        {viewMode === 'grid' ? (
          <DocumentGrid
            documents={filteredDocuments}
            isAdmin={isAdmin}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onOpenQR={(doc) => setQrDoc(doc)}
            onCopyLink={handleCopyLink}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteDoc}
            onTogglePin={handleTogglePin}
          />
        ) : (
          <DocumentTable
            documents={filteredDocuments}
            isAdmin={isAdmin}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onOpenQR={(doc) => setQrDoc(doc)}
            onCopyLink={handleCopyLink}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteDoc}
            onTogglePin={handleTogglePin}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 dark:text-slate-300 font-medium">
            <span>{CONFIG.SCHOOL_NAME}</span>
            <span>•</span>
            <span>{CONFIG.DEPARTMENT_NAME}</span>
            <span>•</span>
            <a href={CONFIG.DRIVE_URL} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline inline-flex items-center gap-1">
              Google Drive คลังเอกสาร
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a href={CONFIG.SHEET_URL} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-1">
              Google Sheets ฐานข้อมูล
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p>© {new Date().getFullYear() + 543} {CONFIG.APP_NAME_TH} • พัฒนาระบบเพื่อการบริหารงานบุคคลที่มีประสิทธิภาพ</p>
        </div>
      </footer>

      {/* Floating Add Button for Admin */}
      {isAdmin && (
        <button
          onClick={handleOpenAdd}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-xl shadow-teal-600/40 transition-all hover:scale-105 active:scale-95"
          title="เพิ่มเอกสารใหม่"
        >
          <PlusCircle className="w-5 h-5" />
          <span>เพิ่มเอกสารใหม่</span>
        </button>
      )}

      {/* Modals */}
      <PreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
        onCopyLink={handleCopyLink}
      />

      <QRCodeModal
        document={qrDoc}
        onClose={() => setQrDoc(null)}
        onCopyLink={handleCopyLink}
      />

      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentPin={settings.adminPin}
      />

      <AdminAddEditModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveDoc}
        editingDoc={editingDoc}
        isLive={isLive}
      />

      <AdminSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onTestConnection={(url) => apiService.testConnection(url)}
        onInitSheet={(url) => apiService.initSheet(url)}
        onExportExcel={(docs) => apiService.exportToExcel(docs)}
        documents={documents}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}
