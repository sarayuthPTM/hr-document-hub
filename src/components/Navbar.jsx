import React from 'react';
import { 
  FileText, 
  Moon, 
  Sun, 
  ShieldCheck, 
  LogOut, 
  PlusCircle, 
  Settings, 
  Database,
  ExternalLink,
  Lock
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
  isLive 
}) {
  const currentDate = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 glass-panel shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & School Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 ring-2 ring-teal-500/30">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg md:text-xl text-slate-900 dark:text-white tracking-tight">
                  {CONFIG.APP_NAME_TH}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {CONFIG.APP_NAME}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {CONFIG.DEPARTMENT_NAME} • {CONFIG.SCHOOL_NAME}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Live Sheet Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {isLive ? 'Google Sheets (Live)' : 'ระบบออฟไลน์/แคช'}
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdd}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm shadow-teal-600/30 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">เพิ่มเอกสาร</span>
                </button>

                <button
                  onClick={onOpenSettings}
                  className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                  title="ตั้งค่าฐานข้อมูล & Google Sheet"
                >
                  <Settings className="w-5 h-5" />
                </button>

                <button
                  onClick={onLogout}
                  className="p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-rose-200 dark:border-rose-900/50"
                  title="ออกจากระบบแอดมิน"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
              >
                <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>เข้าสู่ระบบแอดมิน</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
