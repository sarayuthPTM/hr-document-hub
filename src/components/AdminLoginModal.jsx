import React, { useState } from 'react';
import { X, Lock, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { CONFIG } from '../config/constants';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess, currentPin }) {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetPin = currentPin || CONFIG.DEFAULT_PIN;

    if (pin === targetPin) {
      if (rememberMe) {
        localStorage.setItem(CONFIG.STORAGE_KEY_ADMIN_AUTH, 'true');
      }
      onLoginSuccess();
      onClose();
      setPin('');
      setError('');
    } else {
      setError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Icon & Header */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
          <KeyRound className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          เข้าสู่ระบบผู้ดูแลระบบ (Admin)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          กรอกรหัสผ่านเพื่อเข้าจัดการ เพิ่ม แก้ไข และลบเอกสารในระบบ
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                autoFocus
                placeholder="ระบุรหัสผ่าน (เริ่มต้น: admin1234)"
                className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-rose-500 font-medium mt-1.5 animate-in fade-in">
                {error}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              * รหัสผ่านตั้งต้นจากระบบคือ: <code className="text-teal-600 dark:text-teal-400 font-mono font-bold">admin1234</code>
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span>จดจำการเข้าสู่ระบบในเครื่องนี้</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all active:scale-95"
            >
              เข้าสู่ระบบทันที
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
