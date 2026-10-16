/** Dear Memory contract PDF. Preserve two original A4 pages without silently clipping contents. */
export interface GeneratedDocuments {
  pdfBlob: Blob;
  pdfBase64: string;
  jpgBase64?: string;
}

export interface PdfPageLayout {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  scale: number;
}

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MIN_READABLE_SCALE = 0.82;

/** A measured page that exceeds the configured A4 box must be captured in full. */
export function assertPageFits(
  page: Pick<HTMLElement, 'scrollHeight' | 'clientHeight' | 'scrollWidth' | 'clientWidth'>
): void {
  if (page.scrollHeight > page.clientHeight + 3 || page.scrollWidth > page.clientWidth + 3) {
    throw new Error('계약서 내용이 A4 페이지 영역을 초과했습니다.');
  }
}

/** Fit a complete captured page into ONE A4 sheet while keeping its aspect ratio.
 * Refuse unreadably small text rather than cropping it or creating a surprise page.
 */
export function fitRasterToA4(width: number, height: number): PdfPageLayout {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('계약서 PDF 이미지 크기를 계산하지 못했습니다.');
  }
  const unscaledHeightMm = height / width * PAGE_WIDTH_MM;
  const scale = Math.min(1, PAGE_HEIGHT_MM / unscaledHeightMm);
  if (scale < MIN_READABLE_SCALE) {
    throw new Error('계약서 내용이 너무 길어 2페이지에 읽기 좋게 넣기 어렵습니다. 상품·할인·입력 내용을 점검해 주세요.');
  }
  const widthMm = PAGE_WIDTH_MM * scale;
  const heightMm = unscaledHeightMm * scale;
  return {
    xMm: (PAGE_WIDTH_MM - widthMm) / 2,
    yMm: 0,
    widthMm,
    heightMm,
    scale,
  };
}

function overflowsA4(element: HTMLElement): boolean {
  if (element.scrollHeight > element.clientHeight + 3
    || element.scrollWidth > element.clientWidth + 3) return true;
  const bounds = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const printableBottom = bounds.bottom
    - (parseFloat(style.paddingBottom) || 0)
    - (parseFloat(style.borderBottomWidth) || 0);
  return Array.from(element.children)
    .some(child => child.getBoundingClientRect().bottom > printableBottom + 3);
}

function verifyExpandedPage(element: HTMLElement): void {
  const bounds = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const printableBottom = bounds.bottom
    - (parseFloat(style.paddingBottom) || 0)
    - (parseFloat(style.borderBottomWidth) || 0);
  if (element.scrollHeight > element.clientHeight + 3
    || element.scrollWidth > element.clientWidth + 3
    || Array.from(element.children).some(c => c.getBoundingClientRect().bottom > printableBottom + 3)) {
    throw new Error('계약서 레이아웃에 잘림 위험이 있어 PDF 생성을 중단했습니다.');
  }
}

export interface IPdfGenerator {
  generatePdf(elementId: string, contractNumber: string): Promise<GeneratedDocuments>;
}

export class Html2CanvasPdfGenerator implements IPdfGenerator {
  async generatePdf(
    elementId = 'dear-memory-contract-doc',
    contractNumber = 'DM-CONTRACT'
  ): Promise<GeneratedDocuments> {
    if (typeof window === 'undefined') {
      throw new Error('PDF 생성은 브라우저 환경에서만 실행할 수 있습니다.');
    }
    const container = document.getElementById(elementId);
    if (!container) throw new Error('계약서 화면을 찾을 수 없습니다: ' + elementId);

    if (document.fonts?.ready) {
      try { await document.fonts.ready; }
      catch (error) { console.warn('폰트 로딩 지연:', error); }
    }
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 80)));

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const pages = Array.from(
      container.querySelectorAll<HTMLElement>('.contract-page, [data-pdf-page]')
    );
    if (pages.length !== 2) {
      throw new Error('계약서는 본문 1페이지와 약관 1페이지로 구성되어야 합니다.');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    pdf.setProperties({ title: contractNumber });
    let firstPageJpg = '';

    for (let index = 0; index < pages.length; index++) {
      const element = pages[index];
      const oldStyle = {
        height: element.style.height,
        maxHeight: element.style.maxHeight,
        minHeight: element.style.minHeight,
      };
      let canvas: HTMLCanvasElement;
      try {
        if (overflowsA4(element)) {
          // Only change layout while capturing; never mutate the actual contract DOM.
          element.style.height = 'auto';
          element.style.maxHeight = 'none';
          element.style.minHeight = '297mm';
          await new Promise(resolve => requestAnimationFrame(resolve));
          verifyExpandedPage(element);
        } else {
          assertPageFits(element);
        }
        canvas = await html2canvas(element, {
          scale: 3.5,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          logging: false,
          imageTimeout: 0,
          onclone: doc => {
            const style = doc.createElement('style');
            style.textContent =
              '*{-webkit-font-smoothing:antialiased!important;-moz-osx-font-smoothing:grayscale!important;text-rendering:geometricPrecision!important}';
            doc.head.appendChild(style);
          },
        });
      } finally {
        element.style.height = oldStyle.height;
        element.style.maxHeight = oldStyle.maxHeight;
        element.style.minHeight = oldStyle.minHeight;
      }

      const raster = canvas!;
      const fit = fitRasterToA4(raster.width, raster.height);
      const png = raster.toDataURL('image/png');
      if (index === 0) firstPageJpg = png;
      else pdf.addPage();
      pdf.addImage(png, 'PNG', fit.xMm, fit.yMm, fit.widthMm, fit.heightMm, undefined, 'SLOW');

      // Page number stays accurate; the PDF always has two A4 sheets.
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(String(index + 1) + ' / 2', 202, 294.5, { align: 'right' });
    }

    const pdfBlob = pdf.output('blob');
    return {
      pdfBlob,
      pdfBase64: pdf.output('datauristring'),
      jpgBase64: firstPageJpg,
    };
  }
}

const defaultGenerator = new Html2CanvasPdfGenerator();

export async function exportContractToPdfAndJpg(
  elementId = 'dear-memory-contract-doc',
  contractNumber = 'DM-CONTRACT'
): Promise<GeneratedDocuments> {
  return defaultGenerator.generatePdf(elementId, contractNumber);
}

export function triggerFileDownload(blobOrUrl: Blob | string, filename: string): void {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  if (typeof blobOrUrl !== 'string') URL.revokeObjectURL(url);
}
