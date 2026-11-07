import React from 'react';
import { 
  FileText, 
  Moon, 
  Sun, 
  LogOut, 
  PlusCircle, 
  Settings, 
  Lock,
  BarChart3,
  FolderOpen
} from 'lucide-react';
import { CONFIG } from '../config/constants';

export default function Navbar({ 
  darkMode, 
  setDarkMode, 
  isAdmin, 
  onOpenLogin, 
  onLogout, 
  onOpenAdd, 
  onOpenSettings,
  activeTab,
  setActiveTab,
  settings = {}
}) {
  const appNameTh = settings.appNameTh || CONFIG.APP_NAME_TH;
  const appNameEn = settings.appNameEn || CONFIG.APP_NAME;
  const schoolName = settings.schoolName || CONFIG.SCHOOL_NAME;
  const departmentName = settings.departmentName || CONFIG.DEPARTMENT_NAME;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 glass-panel shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Dynamic School Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 drop-shadow-sm">
              <img 
                src="/logo.png?v=4" 
                alt="KBS HR Docs Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  {appNameTh}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
                  ระบบรวบรวมเอกสาร
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {departmentName} • {schoolName}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs: Documents vs Analytics */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'documents'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>คลังเอกสาร & แบบฟอร์ม</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>สถิติเชิงลึก (Dashboard)</span>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveTab('documents')}
                className={`p-1.5 rounded-md text-xs ${activeTab === 'documents' ? 'bg-white dark:bg-slate-700 text-teal-600' : 'text-slate-500'}`}
                title="คลังเอกสาร"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`p-1.5 rounded-md text-xs ${activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 text-teal-600' : 'text-slate-500'}`}
                title="สถิติเชิงลึก"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xs transition-all active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">เพิ่มเอกสาร</span>
                </button>

                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                  title="ตั้งค่าระบบ & ปรับแต่งข้อมูล"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-rose-200 dark:border-rose-900/50"
                  title="ออกจากระบบแอดมิน"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95"
              >
                <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>เข้าสู่ระบบแอดมิน</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
