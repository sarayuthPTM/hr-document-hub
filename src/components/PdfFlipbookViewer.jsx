import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PageFlip } from 'page-flip';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extract Google Drive file ID from common URL formats.
 */
function resolveDriveId(file) {
  if (!file) return '';
  if (file.driveId) return file.driveId;
  const raw = file.downloadUrl || file.url || file.previewUrl || '';
  if (!raw || (!raw.includes('drive.google.com') && !raw.includes('docs.google.com'))) return '';
  if (raw.includes('/folders/')) return '';
  const pathMatch = raw.match(/\/(?:file\/d|document\/d|spreadsheets\/d|presentation\/d)\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];
  const idMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return idMatch ? idMatch[1] : '';
}

/**
 * Fetch PDF bytes cleanly via same-origin Vercel API proxy (/api/pdf) first (eliminating Drive CORS blocks),
 * then fall back to direct Google Drive CDN / Google Docs PDF export / direct URL.
 */
async function fetchPdfArrayBuffer(file, signal) {
  const driveId = resolveDriveId(file);
  const rawUrl = file?.previewUrl || file?.url || file?.downloadUrl || '';
  const dlRawUrl = file?.downloadUrl || file?.url || '';
  const fileType = String(file?.type || '').toUpperCase();

  const candidateUrls = [];
  const isDocsDoc = rawUrl.includes('docs.google.com/document/d/') || fileType === 'DOCX';
  const isDocsSlides = rawUrl.includes('docs.google.com/presentation/d/') || fileType === 'PPTX';
  const isDocsSheets = rawUrl.includes('docs.google.com/spreadsheets/d/') || fileType === 'XLSX';
  const docKind = isDocsSlides ? 'presentation' : isDocsSheets ? 'spreadsheet' : 'document';
  const isDocsPreferred = Boolean(
    driveId && (rawUrl.includes('docs.google.com/') || rawUrl.includes('rtpof=true'))
  );

  // 1. Primary: Same-origin proxy (/api/pdf) so browser never hits Google Drive CORS errors
  if (driveId) {
    const proxyMode = isDocsPreferred ? 'export' : 'raw';
    candidateUrls.push(
      `/api/pdf?id=${encodeURIComponent(driveId)}&mode=${proxyMode}&docKind=${docKind}`
    );
  }

  // 2. Fallback direct URLs (used in local dev or if proxy rejects large PDFs >4.5MB)
  const exportUrls = [];
  if (driveId) {
    if (isDocsSlides) {
      exportUrls.push(`https://docs.google.com/presentation/d/${driveId}/export/pdf`);
    } else if (isDocsSheets) {
      exportUrls.push(`https://docs.google.com/spreadsheets/d/${driveId}/export?format=pdf`);
    } else {
      exportUrls.push(`https://docs.google.com/document/d/${driveId}/export?format=pdf`);
    }
  }

  if (isDocsPreferred) {
    candidateUrls.push(...exportUrls);
    candidateUrls.push(`https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`);
  } else if (driveId) {
    candidateUrls.push(`https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`);
    if (isDocsDoc || isDocsSlides || isDocsSheets) {
      candidateUrls.push(...exportUrls);
    }
  }

  if (dlRawUrl && !dlRawUrl.includes('drive.google.com/') && !dlRawUrl.includes('docs.google.com/')) {
    candidateUrls.push(dlRawUrl);
  }

  const uniqueUrls = [...new Set(candidateUrls)];
  let lastError = null;

  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, { signal, credentials: 'omit' });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const buf = await res.arrayBuffer();
      const head = new TextDecoder('latin1').decode(new Uint8Array(buf, 0, Math.min(1024, buf.byteLength)));
      if (!head.includes('%PDF-')) {
        lastError = new Error('ไฟล์ต้นทางไม่ได้อยู่ในรูปแบบ PDF โดยตรง');
        continue;
      }
      return buf;
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      lastError = err;
    }
  }

  throw lastError || new Error('ไม่สามารถโหลดไฟล์ PDF สำหรับโหมด E-book ได้');
}

export default function PdfFlipbookViewer({ file, title, onSwitchToStandard }) {
  const viewportRef = useRef(null);
  const stageHostRef = useRef(null);
  const flipRef = useRef(null);

  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [renderedCount, setRenderedCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed into PageFlip pages
  const [orientation, setOrientation] = useState('landscape');
  const [hasBlankInsideCover, setHasBlankInsideCover] = useState(false);
  const [bookSize, setBookSize] = useState({ width: 420, height: 594 });
  const [zoom, setZoom] = useState(1);

  const destroyFlipbook = useCallback(() => {
    if (flipRef.current) {
      try {
        flipRef.current.destroy();
      } catch {}
      flipRef.current = null;
    }
    if (stageHostRef.current) {
      stageHostRef.current.innerHTML = '';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();
    let activeLoadingTask = null;
    let activePdfDoc = null;

    const cleanupPdf = () => {
      try {
        if (typeof activeLoadingTask?.destroy === 'function') {
          activeLoadingTask.destroy().catch(() => {});
        } else if (typeof activePdfDoc?.cleanup === 'function') {
          activePdfDoc.cleanup();
        }
      } catch {}
    };

    const initEbook = async () => {
      destroyFlipbook();
      setStatus('loading');
      setErrorMessage('');
      setNumPages(0);
      setRenderedCount(0);
      setCurrentPage(0);
      setHasBlankInsideCover(false);
      setZoom(1);

      try {
        const pdfBytes = await fetchPdfArrayBuffer(file, abortController.signal);
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) });
        activeLoadingTask = loadingTask;
        const pdfDoc = await loadingTask.promise;
        activePdfDoc = pdfDoc;
        if (cancelled) {
          cleanupPdf();
          return;
        }

        const total = pdfDoc.numPages;
        if (!total || total < 1) {
          throw new Error('ไม่พบหน้าเอกสารในไฟล์ PDF นี้');
        }
        setNumPages(total);

        // Compute book geometry from Page 1 aspect ratio + container bounds
        const firstPage = await pdfDoc.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const aspect = vp1.width > 0 && vp1.height > 0 ? vp1.width / vp1.height : 0.707;

        const box = viewportRef.current?.getBoundingClientRect();
        const containerW = box?.width || Math.min(window.innerWidth - 48, 920);
        const containerH = box?.height || Math.min(window.innerHeight - 220, 600);
        const isNarrow = containerW < 640;

        const maxPageW = isNarrow
          ? Math.max(240, containerW - 36)
          : Math.max(250, (containerW - 64) / 2);
        const maxPageH = Math.max(300, containerH - 36);

        let singleH = Math.floor(Math.min(maxPageH, maxPageW / aspect));
        let singleW = Math.floor(singleH * aspect);
        if (singleW < 220) {
          singleW = 220;
          singleH = Math.floor(singleW / aspect);
        }

        setBookSize({ width: singleW, height: singleH });

        if (!stageHostRef.current || cancelled) return;
        stageHostRef.current.innerHTML = '';

        // Dedicated child host because PageFlip.destroy() detaches its root element
        const flipHostEl = document.createElement('div');
        const targetStageWidth = isNarrow ? singleW : singleW * 2;
        flipHostEl.style.width = `${targetStageWidth}px`;
        flipHostEl.style.height = `${singleH}px`;
        flipHostEl.className = 'mx-auto shadow-2xl rounded-sm';
        stageHostRef.current.appendChild(flipHostEl);

        // On desktop (>=640px) with >=2 pages: Front cover sits alone first, then Spread 2 has [Blank Inside Cover | Page 2], then [3|4], [5|6]...
        const useInsideCoverBlank = !isNarrow && total >= 2;
        setHasBlankInsideCover(useInsideCoverBlank);

        const pageEls = [];
        const imgEls = [];
        const spinnerEls = [];

        for (let i = 1; i <= total; i++) {
          const isLeftInSpread = useInsideCoverBlank ? (i >= 2 && i % 2 === 1) : (!isNarrow && i % 2 === 1);
          const pageDiv = document.createElement('div');
          pageDiv.className =
            'bg-white relative overflow-hidden select-none border border-slate-200/90 shadow-inner';
          if (i === 1 || i === total) {
            pageDiv.dataset.density = 'hard';
          }

          // Subtle spine gradient highlight along center binding edge
          const spineOverlay = document.createElement('div');
          spineOverlay.className =
            'pointer-events-none absolute inset-y-0 w-7 opacity-40 z-10 ' +
            (isLeftInSpread
              ? 'right-0 bg-gradient-to-l from-slate-900/20 to-transparent'
              : 'left-0 bg-gradient-to-r from-slate-900/20 to-transparent');
          pageDiv.appendChild(spineOverlay);

          const loaderOverlay = document.createElement('div');
          loaderOverlay.className =
            'absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-xs gap-2';
          loaderOverlay.innerHTML = `<span class="inline-block w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></span><span>กำลังจัดเตรียมหน้า ${i}/${total}</span>`;
          pageDiv.appendChild(loaderOverlay);

          const img = document.createElement('img');
          img.alt = `${title || 'E-book'} หน้า ${i}`;
          img.className = 'w-full h-full object-contain bg-white hidden select-none pointer-events-none';
          img.draggable = false;
          pageDiv.appendChild(img);

          if (i > 1) {
            const pageFooter = document.createElement('span');
            pageFooter.className =
              'pointer-events-none absolute bottom-1.5 ' +
              (isLeftInSpread ? 'left-2.5' : 'right-2.5') +
              ' px-1.5 py-0.5 rounded bg-slate-900/55 text-white text-[9px] font-mono z-10';
            pageFooter.textContent = `${i}`;
            pageDiv.appendChild(pageFooter);
          }

          pageEls.push(pageDiv);
          imgEls.push(img);
          spinnerEls.push(loaderOverlay);

          // Insert blank inside-cover page right after Front Cover so Page 2 ("คำนำ") opens opposite a clean blank left page
          if (i === 1 && useInsideCoverBlank) {
            const blankDiv = document.createElement('div');
            blankDiv.className =
              'bg-gradient-to-r from-slate-50 via-white to-white relative overflow-hidden select-none border border-slate-200/90 shadow-inner';
            const blankSpineOverlay = document.createElement('div');
            blankSpineOverlay.className =
              'pointer-events-none absolute inset-y-0 right-0 w-7 opacity-40 z-10 bg-gradient-to-l from-slate-900/20 to-transparent';
            blankDiv.appendChild(blankSpineOverlay);
            pageEls.push(blankDiv);
          }
        }

        // Render helper per page at sharp retina resolution for clean zooming
        const renderPageImage = async (pageNum) => {
          const page = pageNum === 1 ? firstPage : await pdfDoc.getPage(pageNum);
          if (cancelled) return;
          const baseVp = page.getViewport({ scale: 1 });
          const renderScale = Math.min(2.1, Math.max(1.35, 1300 / Math.max(baseVp.width, 1)));
          const vp = page.getViewport({ scale: renderScale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(vp.width);
          canvas.height = Math.ceil(vp.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          if (cancelled) return;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          canvas.width = 0;
          canvas.height = 0;

          const imgEl = imgEls[pageNum - 1];
          const spinnerEl = spinnerEls[pageNum - 1];
          if (imgEl) {
            imgEl.src = dataUrl;
            imgEl.classList.remove('hidden');
          }
          if (spinnerEl) {
            spinnerEl.classList.add('hidden');
          }
          setRenderedCount((prev) => Math.max(prev, pageNum));
        };

        // Render first 2 pages before mounting PageFlip so both open pages appear crisp immediately
        const initialReadyCount = Math.min(total, isNarrow ? 1 : 2);
        for (let p = 1; p <= initialReadyCount; p++) {
          if (cancelled) return;
          await renderPageImage(p);
        }
        if (cancelled) return;

        const pageFlip = new PageFlip(flipHostEl, {
          width: singleW,
          height: singleH,
          size: 'fixed',
          minWidth: singleW,
          maxWidth: singleW,
          minHeight: singleH,
          maxHeight: singleH,
          drawShadow: true,
          maxShadowOpacity: 0.45,
          flippingTime: 650,
          usePortrait: isNarrow,
          autoSize: true,
          showCover: true,
          mobileScrollSupport: true,
          showPageCorners: true,
          clickEventForward: true
        });

        pageFlip.on('init', (e) => {
          if (cancelled) return;
          if (e?.data?.mode) setOrientation(e.data.mode);
          setCurrentPage(e?.data?.page || 0);
        });

        pageFlip.on('flip', (e) => {
          if (cancelled) return;
          if (typeof e?.data === 'number') setCurrentPage(e.data);
        });

        pageFlip.on('changeOrientation', (e) => {
          if (cancelled) return;
          if (e?.data) setOrientation(e.data);
        });

        pageFlip.loadFromHTML(pageEls);
        flipRef.current = pageFlip;
        setStatus('ready');

        // Progressively render remaining pages in background without interrupting flipping
        for (let p = initialReadyCount + 1; p <= total; p++) {
          if (cancelled) return;
          await renderPageImage(p);
        }
      } catch (err) {
        if (cancelled || err?.name === 'AbortError') return;
        console.warn('E-book load fallback:', err);
        setErrorMessage(err?.message || 'ไม่สามารถเปิดไฟล์ PDF ในโหมด E-book ได้');
        setStatus('error');
      }
    };

    initEbook();

    return () => {
      cancelled = true;
      abortController.abort();
      destroyFlipbook();
      cleanupPdf();
    };
  }, [file, title, destroyFlipbook]);

  // Keyboard navigation (Left / Right arrows)
  useEffect(() => {
    if (status !== 'ready') return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        flipRef.current?.flipNext();
      } else if (e.key === 'ArrowLeft') {
        flipRef.current?.flipPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  const lastSpreadStart =
    numPages === 0
      ? 0
      : orientation === 'portrait'
        ? numPages - 1
        : hasBlankInsideCover
          ? numPages % 2 === 0
            ? numPages - 1
            : numPages
          : numPages % 2 === 0
            ? numPages - 2
            : numPages - 1;
  const isAtEnd = currentPage >= lastSpreadStart;

  const handlePrev = () => flipRef.current?.flipPrev();
  const handleNext = () => flipRef.current?.flipNext();
  const handleFirst = () => flipRef.current?.flip(0);
  const handleLast = () => {
    if (numPages > 0) flipRef.current?.flip(lastSpreadStart);
  };

  const pageLabel = (() => {
    if (numPages === 0) return '-';
    if (orientation === 'portrait') {
      return `หน้า ${currentPage + 1} / ${numPages}`;
    }
    if (hasBlankInsideCover) {
      if (currentPage === 0) {
        return `หน้าปก (1 / ${numPages})`;
      }
      if (currentPage === 1) {
        return `ปกใน - หน้า 2 / ${numPages}`;
      }
      const leftPdf = currentPage;
      const rightPdf = currentPage + 1 <= numPages ? currentPage + 1 : null;
      return rightPdf ? `หน้า ${leftPdf}-${rightPdf} / ${numPages}` : `หน้า ${leftPdf} / ${numPages}`;
    }
    if (currentPage === 0) {
      return `หน้าปก (1 / ${numPages})`;
    }
    const leftNum = currentPage + 1;
    const rightNum = currentPage + 2 <= numPages ? currentPage + 2 : null;
    return rightNum ? `หน้า ${leftNum}-${rightNum} / ${numPages}` : `หน้า ${leftNum} / ${numPages}`;
  })();

  const isLandscape = orientation === 'landscape';
  const baseStageW = isLandscape ? bookSize.width * 2 : bookSize.width;
  const baseStageH = bookSize.height;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 shadow-inner relative">
      {/* Book Stage Viewport */}
      <div
        ref={viewportRef}
        className={`flex-1 relative ${
          zoom > 1 ? 'overflow-auto' : 'overflow-hidden flex items-center justify-center'
        } p-3 sm:p-4`}
      >
        {/* Loading Overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg">
              <BookOpen className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>กำลังเปิดหนังสือ E-book...</span>
              </p>
              <p className="text-xs text-slate-300">
                {numPages > 0
                  ? `กำลังจัดหน้ากระดาษ (${renderedCount}/${numPages} หน้า)`
                  : 'กำลังดาวน์โหลดไฟล์ PDF เพื่อสร้างหน้าพลิก 3 มิติ'}
              </p>
            </div>
            {numPages > 0 && (
              <div className="w-56 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-indigo-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((renderedCount / Math.min(numPages, 2)) * 100))}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Error / CORS Fallback Overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/95 text-white p-6 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h4 className="text-sm sm:text-base font-bold">ไม่สามารถเรนเดอร์ไฟล์นี้ในโหมด E-book</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
            </div>
            {onSwitchToStandard && (
              <button
                type="button"
                onClick={onSwitchToStandard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>เปิดดูในมุมมอง PDF ปกติทันที</span>
              </button>
            )}
          </div>
        )}

        {/* Scroll-safe Zoom Wrapper holding imperative PageFlip stage */}
        <div
          className={zoom > 1 ? 'mx-auto flex items-center justify-center' : 'flex items-center justify-center w-full'}
          style={
            zoom > 1
              ? {
                  width: `${Math.round(baseStageW * zoom)}px`,
                  height: `${Math.round(baseStageH * zoom)}px`
                }
              : undefined
          }
        >
          <div
            ref={stageHostRef}
            className="w-full flex items-center justify-center transition-transform duration-200 origin-center"
            style={{
              transform: zoom !== 1 ? `scale(${zoom})` : undefined
            }}
          />
        </div>
      </div>

      {/* Bottom Interactive E-book Toolbar */}
      <div className="px-3 sm:px-5 py-2.5 bg-slate-900/95 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
        {/* Left Navigation Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFirst}
            disabled={status !== 'ready' || currentPage <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
            title="หน้าปก / หน้าแรก"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrev}
            disabled={status !== 'ready' || currentPage <= 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none font-semibold transition-colors"
            title="พลิกหน้าก่อนหน้า (ลูกศรซ้าย)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">ก่อนหน้า</span>
          </button>

          <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-teal-300 whitespace-nowrap">
            {pageLabel}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={status !== 'ready' || isAtEnd}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none font-semibold transition-colors"
            title="พลิกหน้าถัดไป (ลูกศรขวา)"
          >
            <span className="hidden sm:inline">ถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLast}
            disabled={status !== 'ready' || isAtEnd}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
            title="หน้าสุดท้าย"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tip (Desktop only) */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>คลิกมุมกระดาษหรือกดลูกศรซ้าย-ขวาเพื่อพลิกหน้า</span>
          {numPages > 0 && renderedCount < numPages && status === 'ready' && (
            <span className="text-teal-400 ml-1">
              (กำลังโหลดหน้า {renderedCount}/{numPages})
            </span>
          )}
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
            disabled={zoom <= 1 || status !== 'ready'}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
            title="ซูมออก"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            disabled={status !== 'ready'}
            className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono font-semibold hover:bg-slate-700 transition-colors"
            title="รีเซ็ตขนาดปกติ (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, Number((z + 0.25).toFixed(2))))}
            disabled={zoom >= 2 || status !== 'ready'}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
            title="ซูมขยาย"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoom > 1 && (
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-teal-400 transition-colors"
              title="รีเซ็ตมุมมอง"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
