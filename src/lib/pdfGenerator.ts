/** Dear Memory PDF generator. A4 overflow becomes additional sheets, never clipped. */
export interface GeneratedDocuments {
  pdfBlob: Blob;
  pdfBase64: string;
  jpgBase64?: string;
}

export function assertPageFits(
  page: Pick<HTMLElement, 'scrollHeight'|'clientHeight'|'scrollWidth'|'clientWidth'>
): void {
  if (page.scrollHeight > page.clientHeight + 3 || page.scrollWidth > page.clientWidth + 3) {
    throw new Error('계약서 내용이 A4 페이지 영역을 초과했습니다.');
  }
}

export function chooseSafePageCut(start: number, proposedEnd: number, safeCuts: number[]): number {
  const minimum = start + (proposedEnd - start) * 0.55;
  const candidates = safeCuts.filter((point) => point > minimum && point < proposedEnd - 3);
  return candidates.length ? Math.max(...candidates) : proposedEnd;
}

export interface IPdfGenerator {
  generatePdf(elementId: string, contractNumber: string): Promise<GeneratedDocuments>;
}
interface Sheet {
  data: string;
  yMm: number;
  heightMm: number;
}
const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const CONTINUATION_TOP = 15;
const CONTINUATION_CONTENT = 267;

function pageOverflows(page: HTMLElement): boolean {
  if (page.scrollHeight > page.clientHeight + 3 || page.scrollWidth > page.clientWidth + 3) return true;
  const rect = page.getBoundingClientRect();
  const style = getComputedStyle(page);
  const limit = rect.bottom - (parseFloat(style.paddingBottom)||0)
    - (parseFloat(style.borderBottomWidth)||0);
  return Array.from(page.children).some((child) => child.getBoundingClientRect().bottom > limit + 3);
}

function findSafeCuts(page: HTMLElement, pixelRatio: number): number[] {
  const children = Array.from(page.children);
  const top = page.getBoundingClientRect().top;
  const points: number[] = [];
  for (let i=0; i<children.length-1; i++) {
    const lower = children[i].getBoundingClientRect().bottom;
    const upper = children[i+1].getBoundingClientRect().top;
    if (upper > lower + 2) points.push(Math.round(((upper+lower)/2-top)*pixelRatio));
  }
  return points;
}
function cropImage(canvas: HTMLCanvasElement, from: number, height: number): string {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('PDF 페이지 분할용 Canvas 생성 실패');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0,0,out.width,out.height);
  ctx.drawImage(canvas,0,from,canvas.width,height,0,0,canvas.width,height);
  return out.toDataURL('image/png');
}

export class Html2CanvasPdfGenerator implements IPdfGenerator {
  async generatePdf(
    elementId = 'dear-memory-contract-doc',
    contractNumber = 'DM-CONTRACT'
  ): Promise<GeneratedDocuments> {
    if (typeof window === 'undefined') throw new Error('PDF는 브라우저에서만 생성할 수 있습니다.');
    const parent = document.getElementById(elementId);
    if (!parent) throw new Error('계약서 DOM 요소를 찾지 못했습니다: ' + elementId);
    if (document.fonts?.ready) {
      try { await document.fonts.ready; }
      catch (error) { console.warn('폰트 로딩 경고:', error); }
    }
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 80)));

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const pageElements = Array.from(
      parent.querySelectorAll<HTMLElement>('.contract-page, [data-pdf-page]')
    );
    const targets = pageElements.length ? pageElements : [parent];
    const sheets: Sheet[] = [];

    for (const element of targets) {
      const original = {
        height: element.style.height,
        maxHeight: element.style.maxHeight,
        minHeight: element.style.minHeight,
      };
      const needsExpansion = pageOverflows(element);
      let canvas: HTMLCanvasElement;
      let safeCuts: number[] = [];
      try {
        if (needsExpansion) {
          element.style.height = 'auto';
          element.style.maxHeight = 'none';
          element.style.minHeight = '297mm';
          await new Promise((resolve) => requestAnimationFrame(resolve));
        } else {
          assertPageFits(element);
        }
        canvas = await html2canvas(element,{
          scale:3.5,
          useCORS:true,
          backgroundColor:'#FFFFFF',
          logging:false,
          imageTimeout:0,
          onclone:(doc)=>{
            const style=doc.createElement('style');
            style.textContent='* {-webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; text-rendering: geometricPrecision !important;}';
            doc.head.appendChild(style);
          },
        });
        safeCuts = findSafeCuts(element, canvas.width / element.getBoundingClientRect().width);
      } finally {
        element.style.height = original.height;
        element.style.maxHeight = original.maxHeight;
        element.style.minHeight = original.minHeight;
      }
      const raster=canvas!;
      const nominalHeight=Math.round(raster.width * A4_HEIGHT / A4_WIDTH);
      if (raster.height <= nominalHeight + 10) {
        sheets.push({data:raster.toDataURL('image/png'),yMm:0,heightMm:A4_HEIGHT});
        continue;
      }
      let pos=0;
      while (pos < raster.height) {
        const continued=pos>0;
        const availableMm=continued?CONTINUATION_CONTENT:A4_HEIGHT;
        const availablePx=Math.floor(raster.width * availableMm/A4_WIDTH);
        const target=Math.min(raster.height,pos+availablePx);
        const isLast=raster.height-pos<=availablePx+10;
        const ending=isLast?raster.height:chooseSafePageCut(pos,target,safeCuts);
        const height=ending-pos;
        if (height<=0) throw new Error('PDF 페이지 분할 지점 계산 실패');
        sheets.push({
          data:cropImage(raster,pos,height),
          yMm:continued?CONTINUATION_TOP:0,
          heightMm:Math.min(availableMm,height/raster.width*A4_WIDTH),
        });
        pos=ending;
      }
    }

    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
    pdf.setProperties({title:contractNumber});
    let firstPageJpg='';
    sheets.forEach((sheet,index)=>{
      if(index) pdf.addPage();
      if(!index) firstPageJpg=sheet.data;
      if(sheet.yMm>0) {
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(8);
        pdf.setTextColor(90,90,90);
        pdf.text('DEAR MEMORY - CONTRACT CONTINUED',15,9);
      }
      pdf.addImage(sheet.data,'PNG',0,sheet.yMm,A4_WIDTH,sheet.heightMm,undefined,'SLOW');
      pdf.setFont('helvetica','normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100,100,100);
      pdf.text(String(index+1)+' / '+String(sheets.length),200,294,{align:'right'});
    });
    return {
      pdfBlob:pdf.output('blob'),
      pdfBase64:pdf.output('datauristring'),
      jpgBase64:firstPageJpg,
    };
  }
}
const defaultGenerator=new Html2CanvasPdfGenerator();
export async function exportContractToPdfAndJpg(
  elementId='dear-memory-contract-doc',
  contractNumber='DM-CONTRACT'
):Promise<GeneratedDocuments>{
  return defaultGenerator.generatePdf(elementId,contractNumber);
}
export function triggerFileDownload(blobOrUrl:Blob|string,filename:string):void{
  const url=typeof blobOrUrl==='string'?blobOrUrl:URL.createObjectURL(blobOrUrl);
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if(typeof blobOrUrl!=='string') URL.revokeObjectURL(url);
}
