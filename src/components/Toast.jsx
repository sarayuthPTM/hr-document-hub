import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgStyles = {
    success: 'bg-emerald-600 text-white shadow-emerald-600/30',
    error: 'bg-rose-600 text-white shadow-rose-600/30',
    info: 'bg-teal-600 text-white shadow-teal-600/30'
  };

  const IconComponent = type === 'error' ? AlertCircle : (type === 'info' ? Info : CheckCircle2);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${bgStyles[type] || bgStyles.success} text-xs sm:text-sm font-medium`}>
        <IconComponent className="w-5 h-5 flex-shrink-0" />
        <span>{message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
