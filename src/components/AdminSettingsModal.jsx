import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  ExternalLink, 
  Key, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  FileSpreadsheet, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  Copy,
  Sparkles,
  DownloadCloud,
  CheckCircle2
} from 'lucide-react';
import { CONFIG } from '../config/constants';

export default function AdminSettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings, 
  onTestConnection, 
  onInitSheet, 
  onExportExcel,
  documents 
}) {
  const [gasUrl, setGasUrl] = useState(settings.gasUrl || '');
  const [adminPin, setAdminPin] = useState(settings.adminPin || CONFIG.DEFAULT_PIN);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      gasUrl: gasUrl.trim(),
      adminPin: adminPin.trim()
    });
    setTestResult({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
  };

  const handleTest = async () => {
    if (!gasUrl.trim()) {
      setTestResult({ success: false, message: 'กรุณากรอก URL ของ Google Apps Script Web App ก่อนทดสอบ' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(gasUrl.trim());
      setTestResult({ success: true, message: 'เชื่อมต่อระบบสำเร็จ! Google Sheet พร้อมใช้งาน' });
    } catch (err) {
      setTestResult({ success: false, message: 'การเชื่อมต่อล้มเหลว: ' + err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleInit = async () => {
    if (!gasUrl.trim()) {
      setInitResult({ success: false, message: 'กรุณากรอก URL Web App ก่อนสั่งสร้างตาราง' });
      return;
    }
    if (!window.confirm('คุณต้องการสั่งสร้างคอลัมน์และข้อมูลเริ่มต้นลงใน Google Sheet ใช่หรือไม่?')) return;

    setIsInitializing(true);
    setInitResult(null);
    try {
      const res = await onInitSheet(gasUrl.trim());
      setInitResult({ success: true, message: 'สร้างตารางและหัวข้อใน Google Sheet สำเร็จ!' });
    } catch (err) {
      setInitResult({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
    } finally {
      setIsInitializing(false);
    }
  };

  const gasSampleCode = `// ดูไฟล์ Code.gs ฉบับสมบูรณ์ในโฟลเดอร์ google-apps-script/Code.gs
// ตั้งค่า:
// SHEET_ID: '${CONFIG.SHEET_ID}'
// DRIVE_FOLDER_ID: '${CONFIG.DRIVE_FOLDER_ID}'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ตั้งค่าระบบ & เชื่อมต่อฐานข้อมูล
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการการเชื่อมต่อ Google Sheets, Google Drive และรหัสผ่านแอดมิน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Database Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Google Sheet Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Google Sheet Database
                </span>
                <a
                  href={CONFIG.SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                >
                  <span>เปิดชีต</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate" title={CONFIG.SHEET_ID}>
                ID: {CONFIG.SHEET_ID}
              </p>
            </div>

            {/* Google Drive Folder Card */}
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-teal-600" />
                  Google Drive Folder
                </span>
                <a
                  href={CONFIG.DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
                >
                  <span>เปิดไดรฟ์</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate" title={CONFIG.DRIVE_FOLDER_ID}>
                ID: {CONFIG.DRIVE_FOLDER_ID}
              </p>
            </div>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* GAS URL Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Apps Script Web App URL (URL สำหรับเชื่อมต่อระบบ API)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
                >
                  {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                * หากยังไม่ได้สร้าง Web App ให้ดูขั้นตอนด้านล่าง หรือระบบจะทำงานในโหมด LocalStorage ออฟไลน์ให้อัตโนมัติ
              </p>
            </div>

            {/* Test / Init Result Notification */}
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Change Admin PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                รหัสผ่านแอดมิน (Admin PIN)
              </label>
              <input
                type="text"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="admin1234"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInit}
                  disabled={isInitializing || !gasUrl}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50"
                  title="สั่งให้สร้างคอลัมน์และข้อมูลเริ่มต้นลงใน Google Sheet"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isInitializing ? 'กำลังสร้าง...' : 'สร้างตารางใน Sheet อัตโนมัติ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onExportExcel(documents)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  title="ส่งออกเอกสารทั้งหมดเป็น Excel .xlsx สำรองข้อมูล"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ส่งออก Excel (.xlsx)</span>
                </button>
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </form>

          {/* Collapsible Deployment Guide */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-teal-600" />
                ขั้นตอนการเปิดใช้งาน Google Apps Script Backend (2 นาที)
              </span>
              {showGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showGuide && (
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    เปิด <strong>Google Sheet</strong> ของคุณ (<a href={CONFIG.SHEET_URL} target="_blank" rel="noreferrer" className="text-teal-600 underline">คลิกที่นี่</a>)
                  </li>
                  <li>
                    ไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
                  </li>
                  <li>
                    นำโค้ดจากไฟล์ <code>google-apps-script/Code.gs</code> ไปวางทับในหน้า Apps Script
                  </li>
                  <li>
                    กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong>รายการทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                  </li>
                  <li>
                    เลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong>
                  </li>
                  <li>
                    ตั้งค่า:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-500">
                      <li>ดำเนินการในฐานะ (Execute as): <strong>ฉัน (อีเมลของคุณ)</strong></li>
                      <li>ผู้มีสิทธิ์เข้าถึง (Who has access): <strong>ทุกคน (Anyone)</strong></li>
                    </ul>
                  </li>
                  <li>
                    กด <strong>ทำให้ใช้งานได้ (Deploy)</strong> แล้วคัดลอก URL ของเว็บแอป (ลงท้ายด้วย <code>/exec</code>) มาวางในช่องด้านบนนี้
                  </li>
                </ol>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
