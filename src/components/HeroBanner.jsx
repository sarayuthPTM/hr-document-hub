import React from 'react';
import { 
  Search, 
  X, 
  FolderKanban, 
  FileText, 
  Award, 
  TrendingUp, 
  Megaphone, 
  FileCheck2, 
  HeartHandshake, 
  Briefcase, 
  BookOpen, 
  DownloadCloud, 
  ExternalLink,
  Sparkles,
  Layers,
  Database,
  Eye
} from 'lucide-react';
import { CONFIG, CATEGORIES } from '../config/constants';

const ICON_MAP = {
  FolderKanban: FolderKanban,
  FileText: FileText,
  Award: Award,
  TrendingUp: TrendingUp,
  Megaphone: Megaphone,
  FileCheck2: FileCheck2,
  HeartHandshake: HeartHandshake,
  Briefcase: Briefcase,
  BookOpen: BookOpen
};

export default function HeroBanner({ 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory, 
  stats, 
  categoryCounts 
}) {
  return (
    <div className="relative pt-6 pb-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-56 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Main Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-950/20 border border-slate-700/50 relative overflow-hidden">
        
        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>KBS HR Digital Document Center</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3 leading-snug">
            ศูนย์รวมเอกสาร & แบบฟอร์มงานบุคคล
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            สืบค้น ดาวน์โหลดแบบฟอร์ม คำสั่ง ข้อตกลง PA และแนวปฏิบัติทางราชการ 
            กลุ่มบริหารงานบุคคล โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่ สะดวก รวดเร็ว ได้มาตรฐาน
          </p>

          {/* Search Box */}
          <div className="relative mb-6">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเอกสาร, เลขที่คำสั่ง, แบบฟอร์ม, คำค้นหา (เช่น ใบลา, PA, เงินเดือน, ว14)..."
                className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl bg-white/10 dark:bg-slate-950/40 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent backdrop-blur-md shadow-inner text-sm sm:text-base transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cloud Database Links */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
            <span className="text-slate-400">แหล่งข้อมูลจัดเก็บ:</span>
            <a 
              href={CONFIG.DRIVE_URL} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-white font-medium"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-teal-300" />
              <span>Google Drive (คลังไฟล์)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a 
              href={CONFIG.SHEET_URL} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-white font-medium"
            >
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>Google Sheets (ฐานข้อมูล)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

        </div>

        {/* Quick Stats Badges (Right side on desktop) */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-medium mb-1">
              <FileText className="w-4 h-4" />
              <span>เอกสารทั้งหมด</span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.totalDocs} <span className="text-xs font-normal text-slate-300">ไฟล์</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
              <Layers className="w-4 h-4" />
              <span>หมวดหมู่เอกสาร</span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {CATEGORIES.length - 1} <span className="text-xs font-normal text-slate-300">หมวด</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
              <DownloadCloud className="w-4 h-4" />
              <span>ยอดดาวน์โหลดรวม</span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.totalDownloads.toLocaleString()} <span className="text-xs font-normal text-slate-300">ครั้ง</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium mb-1">
              <Eye className="w-4 h-4" />
              <span>ยอดเปิดดูรวม</span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.totalViews.toLocaleString()} <span className="text-xs font-normal text-slate-300">ครั้ง</span>
            </div>
          </div>
        </div>

      </div>

      {/* Category Pills Slider */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            เลือกดูตามหมวดหมู่
          </span>
          <span className="text-xs text-slate-400">
            คลิกเพื่อกรองข้อมูล
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || FileText;
            const count = categoryCounts[cat.name] || (cat.id === 'all' ? stats.totalDocs : 0);
            const isSelected = selectedCategory === cat.name || (cat.id === 'all' && selectedCategory === 'ทั้งหมด');

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 ring-2 ring-teal-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                <span>{cat.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isSelected 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
