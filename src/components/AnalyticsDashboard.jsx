import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Eye, 
  FileText, 
  Award, 
  Layers, 
  Calendar, 
  Users, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CATEGORIES, YEARS } from '../config/constants';

export default function AnalyticsDashboard({ documents, onPreview, onDownload }) {
  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  // Filtered documents for analytics
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (selectedYear !== 'ทั้งหมด' && String(doc.academicYear) !== String(selectedYear)) {
        return false;
      }
      if (selectedCategory !== 'ทั้งหมด' && doc.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [documents, selectedYear, selectedCategory]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    const totalDocs = filteredDocs.length;
    const totalDownloads = filteredDocs.reduce((sum, d) => sum + (Number(d.downloadCount) || 0), 0);
    const totalViews = filteredDocs.reduce((sum, d) => sum + (Number(d.viewCount) || 0), 0);
    const conversionRate = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : 0;

    // Top downloaded document
    const sortedByDownloads = [...filteredDocs].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    const topDoc = sortedByDownloads[0] || null;

    return { totalDocs, totalDownloads, totalViews, conversionRate, topDoc };
  }, [filteredDocs]);

  // Top 5 Most Downloaded Documents
  const topDownloadedDocs = useMemo(() => {
    return [...filteredDocs]
      .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, 5);
  }, [filteredDocs]);

  // Downloads by Category Breakdown
  const categoryStats = useMemo(() => {
    const map = {};
    filteredDocs.forEach(doc => {
      const cat = doc.category || 'อื่นๆ';
      if (!map[cat]) {
        map[cat] = { name: cat, count: 0, downloads: 0, views: 0 };
      }
      map[cat].count += 1;
      map[cat].downloads += Number(doc.downloadCount) || 0;
      map[cat].views += Number(doc.viewCount) || 0;
    });

    const totalDownloads = metrics.totalDownloads || 1;
    return Object.values(map)
      .map(item => ({
        ...item,
        percent: ((item.downloads / totalDownloads) * 100).toFixed(1)
      }))
      .sort((a, b) => b.downloads - a.downloads);
  }, [filteredDocs, metrics.totalDownloads]);

  // Downloads by Academic Year Breakdown
  const yearStats = useMemo(() => {
    const map = {};
    documents.forEach(doc => {
      const yr = doc.academicYear || 'ไม่ระบุ';
      if (!map[yr]) {
        map[yr] = { year: yr, downloads: 0, count: 0 };
      }
      map[yr].downloads += Number(doc.downloadCount) || 0;
      map[yr].count += 1;
    });

    return Object.values(map).sort((a, b) => b.year.localeCompare(a.year));
  }, [documents]);

  // Downloads by Target Audience Breakdown
  const audienceStats = useMemo(() => {
    const map = {};
    filteredDocs.forEach(doc => {
      const aud = doc.targetAudience || 'บุคลากรทุกคน';
      if (!map[aud]) {
        map[aud] = { audience: aud, downloads: 0, count: 0 };
      }
      map[aud].downloads += Number(doc.downloadCount) || 0;
      map[aud].count += 1;
    });

    return Object.values(map).sort((a, b) => b.downloads - a.downloads);
  }, [filteredDocs]);

  // Export Analytics to Excel
  const handleExportAnalytics = () => {
    const summaryData = [
      { 'รายการสถิติ': 'จำนวนเอกสารทั้งหมดในระบบ', 'ค่า': metrics.totalDocs + ' ไฟล์' },
      { 'รายการสถิติ': 'ยอดเปิดดูเอกสารรวม', 'ค่า': metrics.totalViews + ' ครั้ง' },
      { 'รายการสถิติ': 'ยอดดาวน์โหลดเอกสารรวม', 'ค่า': metrics.totalDownloads + ' ครั้ง' },
      { 'รายการสถิติ': 'อัตราการดาวน์โหลดต่อการเปิดดู (Conversion Rate)', 'ค่า': metrics.conversionRate + '%' },
      { 'รายการสถิติ': 'เอกสารยอดนิยมอันดับ 1', 'ค่า': metrics.topDoc ? metrics.topDoc.title : '-' }
    ];

    const topDocsData = topDownloadedDocs.map((doc, idx) => ({
      'อันดับ': idx + 1,
      'เลขที่เอกสาร': doc.docNumber || '-',
      'ชื่อเอกสาร': doc.title,
      'หมวดหมู่': doc.category,
      'ปี พ.ศ.': doc.academicYear,
      'ยอดเปิดดู': doc.viewCount || 0,
      'ยอดดาวน์โหลด': doc.downloadCount || 0
    }));

    const categoryData = categoryStats.map(cat => ({
      'หมวดหมู่': cat.name,
      'จำนวนเอกสาร': cat.count,
      'ยอดดาวน์โหลดรวม': cat.downloads,
      'สัดส่วนการดาวน์โหลด (%)': cat.percent + '%'
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'ภาพรวมสถิติ');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topDocsData), 'เอกสารยอดนิยม 5 อันดับแรก');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryData), 'สถิติตามหมวดหมู่');

    XLSX.writeFile(wb, `KBS_HR_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const maxCategoryDownloads = categoryStats[0]?.downloads || 1;
  const maxTopDocDownloads = topDownloadedDocs[0]?.downloadCount || 1;

  return (
    <div className="space-y-6 my-4 animate-in fade-in duration-300">
      
      {/* Analytics Header & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-xs font-semibold border border-teal-200 dark:border-teal-800 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
            <span>ระบบวิเคราะห์และรายงานสถิติงานบุคคล</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard Analytics : สถิติการใช้งานแบบฟอร์ม
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ติดตามพฤติกรรมการสืบค้น ความต้องการเอกสาร และแบบฟอร์มยอดนิยมของบุคลากรในโรงเรียน
          </p>
        </div>

        {/* Filter Controls & Export Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
          >
            <option value="ทั้งหมด">ปี พ.ศ. (ทั้งหมด)</option>
            {YEARS.filter(y => y !== 'ทั้งหมด').map(y => (
              <option key={y} value={y}>พ.ศ. {y}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer max-w-[160px] truncate"
          >
            <option value="ทั้งหมด">หมวดหมู่ (ทั้งหมด)</option>
            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Export Report Button */}
          <button
            onClick={handleExportAnalytics}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            title="ส่งออกรายงานสถิติทั้งหมดเป็น Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออกรายงาน Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Downloads */}
        <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-teal-200 dark:border-teal-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">ยอดดาวน์โหลดรวม</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {metrics.totalDownloads.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ครั้ง จากแบบฟอร์มทั้งหมด
          </p>
        </div>

        {/* Total Views */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-indigo-200 dark:border-indigo-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">ยอดเปิดดูเอกสาร</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {metrics.totalViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ครั้งที่มีการเปิดพรีวิวเอกสาร
          </p>
        </div>

        {/* Total Active Docs */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-emerald-200 dark:border-emerald-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">เอกสารพร้อมบริการ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {metrics.totalDocs}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            ไฟล์ ใน {categoryStats.length} หมวดหมู่
          </p>
        </div>

        {/* Top 1 Most Popular Form */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-amber-200 dark:border-amber-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">แบบฟอร์มยอดนิยม #1</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1" title={metrics.topDoc?.title}>
            {metrics.topDoc?.title || '-'}
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1">
            {metrics.topDoc?.downloadCount || 0} ครั้ง ({metrics.topDoc?.docNumber || '-'})
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Top 5 Downloaded Forms */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>5 อันดับแบบฟอร์มที่ถูกดาวน์โหลดมากที่สุด</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เปรียบเทียบความต้องการใช้งานแบบฟอร์มงานบุคคล
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {topDownloadedDocs.map((doc, idx) => {
              const percentOfMax = ((doc.downloadCount || 0) / maxTopDocDownloads) * 100;
              const medals = ['🥇', '🥈', '🥉', '4', '5'];

              return (
                <div key={doc.id} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 truncate max-w-[75%]">
                      <span className="font-bold text-sm w-5 text-center flex-shrink-0">
                        {medals[idx]}
                      </span>
                      <span 
                        onClick={() => onPreview(doc)}
                        className="font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer truncate transition-colors"
                        title={doc.title}
                      >
                        {doc.title}
                      </span>
                      {doc.docNumber && (
                        <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                          {doc.docNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-bold text-teal-600 dark:text-teal-400">
                      <span>{doc.downloadCount || 0}</span>
                      <span className="text-[10px] font-normal text-slate-400">โหลด</span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${percentOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Category Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>สัดส่วนการดาวน์โหลดตามหมวดหมู่</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                วิเคราะห์หมวดหมู่งานที่มีการเบิกใช้เอกสารสูงสุด
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {categoryStats.slice(0, 6).map((cat) => {
              const percent = Number(cat.percent);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[70%]">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span><strong>{cat.downloads}</strong> โหลด</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">({cat.percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Secondary Charts: Year & Target Audience Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Downloads by Academic Year */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>สถิติการใช้งานจำแนกตามปี พ.ศ. / ปีการศึกษา</span>
          </h3>

          <div className="grid grid-cols-3 gap-2.5">
            {yearStats.map(y => (
              <div key={y.year} className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <div className="text-xs font-semibold text-slate-500 mb-0.5">ปี {y.year}</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {y.downloads.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">{y.count} เอกสาร</div>
              </div>
            ))}
          </div>
        </div>

        {/* Downloads by Target Audience */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-teal-600" />
            <span>สถิติการใช้งานจำแนกตามกลุ่มเป้าหมาย</span>
          </h3>

          <div className="space-y-2">
            {audienceStats.map(a => (
              <div key={a.audience} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl">
                <span className="font-medium text-slate-700 dark:text-slate-300">{a.audience}</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{a.downloads} โหลด ({a.count} ไฟล์)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
