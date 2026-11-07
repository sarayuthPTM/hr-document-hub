import React, { useRef } from 'react';
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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Star
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
  categoryCounts,
  favoritesCount = 0,
  settings = {}
}) {
  const categoryScrollRef = useRef(null);

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const appNameTh = settings.appNameTh || CONFIG.APP_NAME_TH;
  const appNameEn = settings.appNameEn || CONFIG.APP_NAME;
  const schoolName = settings.schoolName || CONFIG.SCHOOL_NAME;

  return (
    <div className="pt-2 pb-2">
      {/* Sleek, Compact Modern Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl px-5 py-4 sm:px-6 sm:py-5 shadow-md shadow-slate-950/10 border border-slate-700/60 relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-teal-500/10 blur-2xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Left: Title & Quick Stats */}
          <div className="flex-1 min-w-0 flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center drop-shadow-lg">
              <img src="/logo.png?v=4" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-semibold border border-teal-400/30">
                  <Sparkles className="w-3 h-3 text-teal-300" />
                  ระบบรวบรวมเอกสารงานบุคคล
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">
                  {schoolName}
                </span>
              </div>
              
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{appNameTh}</span>
              </h1>
              
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                <span>เอกสารทั้งหมด <strong>{stats.totalDocs}</strong> รายการ</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>ดาวน์โหลด <strong>{stats.totalDownloads.toLocaleString()}</strong> ครั้ง</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Slim Compact Search Bar */}
          <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเอกสาร, เลขที่, คำสำคัญ..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/10 dark:bg-slate-900/60 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-xs sm:text-sm backdrop-blur-md transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Category Pills Slider with Left/Right Arrows */}
      <div className="mt-3 relative flex items-center">
        
        {/* Left scroll arrow */}
        <button
          onClick={() => scrollCategories('left')}
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors mr-1 flex-shrink-0 z-10"
          title="เลื่อนซ้าย"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={categoryScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none scroll-smooth flex-1"
        >
          {/* Favorites Filter Tab */}
          <button
            onClick={() => setSelectedCategory('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === 'favorites'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400 shadow-sm'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${selectedCategory === 'favorites' ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'}`} />
            <span>รายการโปรด</span>
            {favoritesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedCategory === 'favorites' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Standard Categories */}
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || FileText;
            const count = categoryCounts[cat.name] || (cat.id === 'all' ? stats.totalDocs : 0);
            const isSelected = selectedCategory === cat.name || (cat.id === 'all' && selectedCategory === 'ทั้งหมด');

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 shadow-sm'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  isSelected 
                    ? 'bg-white/25 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow */}
        <button
          onClick={() => scrollCategories('right')}
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors ml-1 flex-shrink-0 z-10"
          title="เลื่อนขวา"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
