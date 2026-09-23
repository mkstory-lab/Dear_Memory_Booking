/**
 * Dear Memory for Booking — PDF & Document Generation Engine
 * 
 * [한글 폰트 무결성 및 A4 렌더링 핵심 보장 장치]
 * 1. document.fonts.ready 비동기 완료 대기로 시스템/웹 폰트 미로딩에 의한 글자 깨짐 및 치수 어긋남 차단
 * 2. html2canvas 고화질(scale: 2) 래스터라이즈로 모든 국문 자모/합자/특수문자 왜곡 없는 무결성 보장
 * 3. 210mm x 297mm A4 1:1 정밀 좌표 배치
 * 4. 향후 대체 엔진(Puppeteer, pdf-lib 등)으로 즉시 교체 가능하도록 어댑터 인터페이스 제공
 */

export interface GeneratedDocuments {
  pdfBlob: Blob;
  pdfBase64: string;
  jpgBase64?: string; // V1.1 대비 유지
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

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`계약서 DOM 요소(#${elementId})를 찾을 수 없습니다.`);
    }

    // 1. 한글 웹폰트 및 시스템 폰트 로딩 완료 보장
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (fontErr) {
        console.warn('폰트 로딩 대기 경고:', fontErr);
      }
    }

    // 2. DOM 렌더링 안정화를 위한 틱 대기
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 80)));

    // 3. 모듈 동적 로드 (SSR 호환)
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;
    const { jsPDF } = await import('jspdf');

    // 4. 고해상도 Canvas 캡처
    const canvas = await html2canvas(element, {
      scale: 2, // 2배율 고해상도
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      windowWidth: 1024, // 모바일에서도 일관된 데스크톱 해상도 렌더링 유지
    });

    // 5. 고화질 이미지 추출
    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // 6. A4 세로 PDF 생성 (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(imgDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    const pdfBlob = pdf.output('blob');
    const pdfBase64 = pdf.output('datauristring');

    return {
      pdfBlob,
      pdfBase64,
      jpgBase64: imgDataUrl, // V1.1 대비용
    };
  }
}

// 기본 싱글톤 인스턴스
const defaultGenerator = new Html2CanvasPdfGenerator();

export async function exportContractToPdfAndJpg(
  elementId = 'dear-memory-contract-doc',
  contractNumber = 'DM-CONTRACT'
): Promise<GeneratedDocuments> {
  return defaultGenerator.generatePdf(elementId, contractNumber);
}

/**
 * 브라우저에서 파일 다운로드 트리거
 */
export function triggerFileDownload(blobOrUrl: Blob | string, filename: string): void {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof blobOrUrl !== 'string') {
    URL.revokeObjectURL(url);
  }
}
