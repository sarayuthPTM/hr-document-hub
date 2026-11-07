import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  ExternalLink, 
  FileSpreadsheet, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Palette
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
  const [gasUrl, setGasUrl] = useState(settings.gasUrl || CONFIG.DEFAULT_GAS_URL || '');
  const [adminPin, setAdminPin] = useState(settings.adminPin || CONFIG.DEFAULT_PIN);
  
  // Customizable System Branding & Copyright fields
  const [appNameTh, setAppNameTh] = useState(settings.appNameTh || CONFIG.APP_NAME_TH);
  const [appNameEn, setAppNameEn] = useState(settings.appNameEn || CONFIG.APP_NAME);
  const [schoolName, setSchoolName] = useState(settings.schoolName || CONFIG.SCHOOL_NAME);
  const [departmentName, setDepartmentName] = useState(settings.departmentName || CONFIG.DEPARTMENT_NAME);
  const [developer, setDeveloper] = useState(settings.developer || CONFIG.DEVELOPER_NAME);
  const [tagline, setTagline] = useState(settings.tagline || CONFIG.TAGLINE);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSettings({
      gasUrl: gasUrl.trim(),
      adminPin: adminPin.trim(),
      appNameTh: appNameTh.trim(),
      appNameEn: appNameEn.trim(),
      schoolName: schoolName.trim(),
      departmentName: departmentName.trim(),
      developer: developer.trim(),
      tagline: tagline.trim()
    });
    setTestResult({ success: true, message: 'บันทึกการตั้งค่าและข้อมูลระบบเรียบร้อยแล้ว' });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                ตั้งค่าระบบ & ปรับแต่งข้อมูล
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการชื่อระบบ, สถานศึกษา, ลิขสิทธิ์ผู้พัฒนา, และฐานข้อมูล Google Sheet
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Notification Alert */}
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

          {/* Section 1: System Branding & Copyright (New Customizable Feature) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Palette className="w-4 h-4 text-teal-600" />
              <span>ข้อมูลชื่อระบบ, หน่วยงาน & ลิขสิทธิ์ผู้พัฒนา</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อระบบ (ภาษาไทย)
                </label>
                <input
                  type="text"
                  value={appNameTh}
                  onChange={(e) => setAppNameTh(e.target.value)}
                  placeholder="ระบบรวบรวมเอกสารงานบุคคล"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อระบบย่อ / ภาษาอังกฤษ
                </label>
                <input
                  type="text"
                  value={appNameEn}
                  onChange={(e) => setAppNameEn(e.target.value)}
                  placeholder="HR Document Hub"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  ชื่อสถานศึกษา / โรงเรียน
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  กลุ่มงาน / ฝ่าย
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="กลุ่มบริหารงานบุคคล"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Developer Copyright Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                ข้อความลิขสิทธิ์ / ผู้พัฒนาระบบ
              </label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="พัฒนาโดย ว่าที่ ร.ต. ศรายุทธ พงค์ทองเมือง"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                สโลแกน / ข้อความท้ายเว็บ
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="พัฒนาระบบเพื่อการบริหารงานบุคคลที่มีประสิทธิภาพ"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Section 2: Database Connection */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                การเชื่อมต่อ Google Apps Script Web App
              </span>
              <a
                href={CONFIG.SHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>เปิด Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-colors whitespace-nowrap"
              >
                {isTesting ? 'ทดสอบ...' : 'ทดสอบ'}
              </button>
            </div>
          </div>

          {/* Section 3: Admin PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              รหัสผ่านผู้ดูแลระบบ (Admin PIN)
            </label>
            <input
              type="text"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              placeholder="2725"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Action Tools & Save Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInit}
                disabled={isInitializing || !gasUrl}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors"
                title="สร้างข้อมูลเริ่มต้นลงใน Google Sheet"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isInitializing ? 'กำลังสร้าง...' : 'สร้างตารางใน Sheet อัตโนมัติ'}</span>
              </button>

              <button
                type="button"
                onClick={() => onExportExcel(documents)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ส่งออก Excel</span>
              </button>
            </div>

            <button
              type="submit"
              className="px-6 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all active:scale-95"
            >
              บันทึกการตั้งค่าทั้งหมด
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
