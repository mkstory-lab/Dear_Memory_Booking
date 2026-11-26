/**
 * Dear Memory Contract — Google Apps Script Web App
 * 
 * 기능:
 * 1. doPost(e): Web App 엔드포인트
 * 2. action: 'submit_contract' -> 대표 이메일 알림 발송 (옵션 및 할인 상세 포함)
 * 3. action: 'approve_and_send' -> 고객 메일 발송(❤️ 하트 포함, PDF 첨부), 대표 메일 발송, Google Drive 자동 저장
 */

// 알림을 수신할 대표 이메일 주소
const REP_EMAIL = "dearmemory@kakao.com";

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload;

    if (action === "referral_journal") {
      return createJsonResponse({ success: true, data: dmReferralJournal_(payload) });
    } else if (action === "submit_contract") {
      return handleSubmitContract(payload);
    } else if (action === "revise_contract") {
      return dmReviseContract_(payload);
    } else if (action === "approve_and_send") {
      return handleApproveAndSend(payload);
    } else if (action === "validate_partner_code") {
      return handleValidatePartnerCode(payload);
    } else {
      return createJsonResponse({ success: false, error: "알 수 없는 요청 액션입니다." });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.page === "referral-setup") return dmReferralSetupPage_();
  if (e && e.parameter && e.parameter.action === "validate_partner_code") {
    return handleValidatePartnerCode({ code: e.parameter.code });
  }
  return ContentService.createTextOutput("Dear Memory Google Apps Script Web App is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 1. 고객 제출 시 대표 알림 메일 발송
 */
function handleSubmitContract(payload) {
  const formData = payload.formData;
  const reviewUrl = payload.reviewUrl || "";
  
  const subject = `[DEAR MEMORY] 신규 계약 접수 | ${formData.groomName} · ${formData.brideName} 고객님 (${formData.weddingDate})`;
  
  // 추가 옵션 정리 (second_shooter 및 sub_photographer 모두 호환)
  const optionNames = [];
  if (formData.optionIds && Array.isArray(formData.optionIds)) {
    if (formData.optionIds.indexOf('second_shooter') !== -1 || formData.optionIds.indexOf('sub_photographer') !== -1) {
      optionNames.push('2인 촬영 (+250,000원)');
    }
    if (formData.optionIds.indexOf('pyebaek') !== -1) {
      optionNames.push('폐백 촬영 (+100,000원)');
    }
  }
  const optionsText = optionNames.length > 0 ? optionNames.join(', ') : '선택 없음';

  // 즉시 할인 정리
  const discountNames = [];
  if (formData.weddingDate) {
    var parts = formData.weddingDate.split('-');
    if (parts.length === 3) {
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (d.getDay() === 0) discountNames.push('일요일 예식 할인 (-100,000원)');
    }
  }
  if (formData.partnerDiscount) {
    discountNames.push('짝꿍 할인 ' + (formData.partnerName ? '(' + formData.partnerName + ')' : '') + ' (-50,000원)');
  }
  if (formData.portfolioConsent) {
    discountNames.push('사진 공개 감사 할인 (-100,000원)');
  }
  const discountsText = discountNames.length > 0 ? discountNames.join(', ') : '적용 없음';

  const htmlBody = `
    <div style="font-family: 'Apple SD Gothic Neo', Pretendard, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #322A1B; background: #FAF8F5; border: 1px solid #EBE3D5; border-radius: 16px;">
      <div style="border-bottom: 2px solid #322A1B; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: bold; color: #8F7A56; letter-spacing: 0.2em; text-transform: uppercase;">DEAR MEMORY FOR BOOKING</span>
        <h2 style="font-size: 20px; font-weight: bold; color: #322A1B; margin: 6px 0 0 0;">신규 본식스냅 계약정보가 접수되었습니다</h2>
      </div>
      
      <div style="background: #FFFFFF; border: 1px solid #EBE3D5; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 13px; line-height: 1.8;">
        <p style="margin: 0;"><strong>신랑·신부:</strong> ${formData.groomName} ❤️ ${formData.brideName}</p>
        <p style="margin: 0;"><strong>예식일시:</strong> ${formData.weddingDate} ${formData.weddingTime}</p>
        <p style="margin: 0;"><strong>예식장소:</strong> ${formData.weddingVenue} ${formData.weddingHall}</p>
        <p style="margin: 0;"><strong>연락처:</strong> 신랑 ${formData.groomPhone} / 신부 ${formData.bridePhone}</p>
        <p style="margin: 0;"><strong>고객 이메일:</strong> ${formData.email}</p>
        <p style="margin: 0;"><strong>선택 상품:</strong> ${formData.productId === 'album_plus' ? '화보형 (대표 추천 · 1,450,000원)' : '실속형 (1,250,000원)'}</p>
        <p style="margin: 0;"><strong>추가 옵션:</strong> ${optionsText}</p>
        <p style="margin: 0;"><strong>즉시 할인:</strong> ${discountsText}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${reviewUrl}" style="display: inline-block; padding: 14px 32px; background: #322A1B; color: #FAF8F5; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 10px;">
          계약서 검토 및 최종 발송하기 →
        </a>
      </div>

      <p style="font-size: 11px; color: #8F7A56; text-align: center; margin: 0;">
        위 버튼을 클릭하시면 대표 검토 화면에서 특약 수정 및 PDF 계약서를 확인 후 즉시 발송하실 수 있습니다.
      </p>
    </div>
  `;

  const targetEmail = (payload.targetEmail || "").trim() || REP_EMAIL;

  GmailApp.sendEmail(targetEmail, subject, "", {
    htmlBody: htmlBody,
    name: "DEAR MEMORY",
  });

  return createJsonResponse({
    success: true,
    message: `${targetEmail}로 알림이 발송되었습니다.`,
  });
}

/**
 * 2. 대표 최종 승인 시 고객/대표 메일 발송 및 Google Drive 백업
 */
function handleApproveAndSend(payload) {
  const { updatedData, pdfBase64, jpgBase64, contractNumber } = payload;
  const data = updatedData;

  const subject = `[DEAR MEMORY] 본식스냅 촬영 계약서 안내 (${data.groomName} · ${data.brideName} 고객님)`;
  
  // PDF Blob 변환 (파일명: 계약번호_신랑이름_신부이름_촬영계약서.pdf)
  let pdfBlob = null;
  const fileName = `${contractNumber}_${data.groomName}_${data.brideName}_촬영계약서.pdf`;
  if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.trim().length > 0) {
    try {
      const commaIdx = pdfBase64.indexOf(",");
      const base64Data = commaIdx !== -1 ? pdfBase64.substring(commaIdx + 1) : pdfBase64;
      const cleanBase64 = base64Data.replace(/[\r\n\s]/g, "");
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      pdfBlob = Utilities.newBlob(decodedBytes, "application/pdf", fileName);
    } catch (pdfErr) {
      Logger.log("PDF Blob 생성 실패: " + pdfErr.toString());
    }
  }

  // 고객 메일 발송 (PDF 첨부 + 신랑·신부 사이에 ❤️ 빨간 하트 적용)
  const customerHtml = `
    <div style="font-family: 'Apple SD Gothic Neo', Pretendard, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #322A1B; background: #FAF8F5; border: 1px solid #EBE3D5; border-radius: 16px;">
      <div style="border-bottom: 2px solid #322A1B; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: bold; color: #8F7A56; letter-spacing: 0.2em; text-transform: uppercase;">DEAR MEMORY</span>
        <h2 style="font-size: 20px; font-weight: bold; color: #322A1B; margin: 6px 0 0 0;">본식스냅 촬영 계약서 안내</h2>
      </div>

      <p style="font-size: 14px; line-height: 1.7; margin-bottom: 16px;">
        안녕하세요, <strong>${data.groomName} ❤️ ${data.brideName}</strong> 고객님.<br/>
        디어메모리와 함께 소중한 첫걸음을 맺어주셔서 진심으로 감사드립니다.
      </p>

      <div style="background: #FFFFFF; border: 1px solid #EBE3D5; border-radius: 12px; padding: 20px; margin-bottom: 20px; font-size: 13px; line-height: 1.8;">
        <p style="margin: 0;"><strong>계약번호:</strong> ${contractNumber}</p>
        <p style="margin: 0;"><strong>예식일시:</strong> ${data.weddingDate} ${data.weddingTime}</p>
        <p style="margin: 0;"><strong>예식장소:</strong> ${data.weddingVenue} ${data.weddingHall}</p>
        <p style="margin: 0;"><strong>선택상품:</strong> ${data.productId === 'album_plus' ? '화보형 (대표 추천)' : '실속형'}</p>
        ${data.optionIds && data.optionIds.length > 0 ? `<p style="margin: 0;"><strong>추가옵션:</strong> ${data.optionIds.map(function(o){ return (o === 'second_shooter' || o === 'sub_photographer') ? '2인 촬영(+25만)' : o === 'pyebaek' ? '폐백 촬영(+10만)' : o; }).join(', ')}</p>` : ''}
      </div>

      <div style="background: #F5F1EA; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 12px; line-height: 1.7; color: #6E5C3D;">
        <p style="margin: 0; font-weight: bold; color: #322A1B; font-size: 13px; margin-bottom: 6px;">[계약금 입금 및 일정 확정 안내]</p>
        <p style="margin: 0;">• 첨부된 공식 PDF 계약서 내용을 확인해 주시기 바랍니다.</p>
        <p style="margin: 0;">• 계약금(300,000원) 입금 확인 시 스케줄이 최종 마감/확정됩니다.</p>
        <p style="margin: 0;">• 72시간 이내 취소 시 계약금 100% 전액 안심 환불 보장됩니다.</p>
      </div>

      <p style="font-size: 13px; line-height: 1.7; text-align: center; color: #322A1B; font-weight: bold; margin: 24px 0 10px 0;">
        두 분의 가장 찬란한 순간을 정성껏 담아내겠습니다.<br/>
        감사합니다.
      </p>

      <div style="text-align: center; border-top: 1px solid #EBE3D5; padding-top: 16px; margin-top: 20px; font-size: 11px; color: #8F7A56;">
        <p style="margin: 0;">DEAR MEMORY • 웨딩 본식스냅 전문 스튜디오</p>
      </div>
    </div>
  `;

  const mailOptions = {
    htmlBody: customerHtml,
    name: "DEAR MEMORY",
  };
  if (pdfBlob) {
    mailOptions.attachments = [pdfBlob];
  }

  GmailApp.sendEmail(data.email, subject, "", mailOptions);

  // 3. Google Drive 자동 저장 (PDF 및 JPG 계약서 안전 보관)
  let driveFolderUrl = "";
  const excelStorage = { saved: false, url: "", error: "" };
  try {
    driveFolderUrl = saveContractToGoogleDrive(data, contractNumber, pdfBlob, jpgBase64, excelStorage);
  } catch (driveErr) {
    Logger.log("Drive 저장 오류: " + driveErr.toString());
  }

  const calendarStorage = dmAfterContractSent_(data, contractNumber, driveFolderUrl, excelStorage);

  return createJsonResponse({
    success: true,
    calendarSaved: calendarStorage.saved,
    calendarEventId: calendarStorage.eventId || '',
    calendarError: calendarStorage.error || '',
    contractNumber: contractNumber,
    customerEmailSent: true,
    driveSaved: !!driveFolderUrl,
    driveFolderUrl: driveFolderUrl,
    excelSaved: excelStorage.saved,
    excelFileUrl: excelStorage.url,
    excelError: excelStorage.error,
    message: !driveFolderUrl ? "고객에게 계약서가 발송되었으나 드라이브 저장을 확인해 주세요."
      : excelStorage.saved ? "고객에게 계약서가 발송되었으며 PDF·JPG·Excel이 드라이브에 저장되었습니다."
      : "고객에게 계약서가 발송되었습니다. Excel 저장을 확인해 주세요. 재발송은 필요하지 않습니다.",
  });
}

/**
 * Google Drive에 폴더 계층 생성 및 파일 저장
 */
function saveContractToGoogleDrive(data, contractNumber, pdfBlob, jpgBase64, excelStorage) {
  const rootFolderName = "Dear Memory";
  const contractsFolderName = "Contracts";
  const yearStr = data.weddingDate.substring(0, 4);
  const targetFolderName = `${data.weddingDate}_${data.groomName}_${data.brideName}`;

  let rootFolder = getOrCreateSubFolder(DriveApp.getRootFolder(), rootFolderName);
  let contractsFolder = getOrCreateSubFolder(rootFolder, contractsFolderName);
  let yearFolder = getOrCreateSubFolder(contractsFolder, yearStr);
  let eventFolder = getOrCreateSubFolder(yearFolder, targetFolderName);

  if (pdfBlob) {
    try {
      eventFolder.createFile(pdfBlob);
    } catch (e) {
      Logger.log("PDF Drive 저장 오류: " + e.toString());
    }
  }

  if (jpgBase64 && typeof jpgBase64 === "string" && jpgBase64.trim().length > 0) {
    try {
      const commaIdx = jpgBase64.indexOf(",");
      const cleanJpg = (commaIdx !== -1 ? jpgBase64.substring(commaIdx + 1) : jpgBase64).replace(/[\r\n\s]/g, "");
      const jpgBytes = Utilities.base64Decode(cleanJpg);
      const jpgBlob = Utilities.newBlob(jpgBytes, "image/jpeg", `${contractNumber}_${data.groomName}_${data.brideName}_촬영계약서.jpg`);
      eventFolder.createFile(jpgBlob);
    } catch (jpgErr) {
      Logger.log("JPG Drive 저장 실패: " + jpgErr.toString());
    }
  }

  // Excel 오류가 이미 발송된 고객 메일이나 PDF/JPG 보관에 영향을 주지 않도록 분리합니다.
  try {
    const excelFile = eventFolder.createFile(createContractExcelBlob(data, contractNumber, pdfBlob));
    if (excelStorage) {
      excelStorage.saved = true;
      excelStorage.url = excelFile.getUrl();
    }
  } catch (excelErr) {
    if (excelStorage) excelStorage.error = "엑셀 저장에 실패했습니다. 실행 로그를 확인해 주세요.";
    Logger.log("Excel Drive 저장 실패: " + excelErr.toString());
  }

  return eventFolder.getUrl();
}

function getOrCreateSubFolder(parent, folderName) {
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(folderName);
}

// 스프레드시트 및 시트 이름 상수
const SPREADSHEET_NAME = "Dear Memory 데이터베이스";
const PARTNER_SHEET_NAME = "짝꿍코드_목록";

/**
 * 짝꿍 코드 스프레드시트 가져오기 또는 자동 생성
 */
function getOrCreatePartnerSheet() {
  const rootFolderName = "Dear Memory";
  const rootFolder = getOrCreateSubFolder(DriveApp.getRootFolder(), rootFolderName);
  
  const files = rootFolder.getFilesByName(SPREADSHEET_NAME);
  let spreadsheet;
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    // 없으면 루트 폴더에 스프레드시트 새로 생성
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    const ssFile = DriveApp.getFileById(spreadsheet.getId());
    rootFolder.addFile(ssFile);
    DriveApp.getRootFolder().removeFile(ssFile);
  }

  let sheet = spreadsheet.getSheetByName(PARTNER_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(PARTNER_SHEET_NAME);
    // 기본 헤더 및 샘플 데이터 작성
    sheet.appendRow(["짝꿍 코드 / 추천인 성함", "할인 금액", "등록일시", "메모"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#F5F1EA");
    sheet.appendRow(["261011김민수", 50000, new Date(), "초기 샘플"]);
    sheet.appendRow(["261122이지은", 50000, new Date(), "초기 샘플"]);
    sheet.appendRow(["테스트짝꿍", 50000, new Date(), "테스트용"]);
  }

  return sheet;
}

/**
 * 3. 짝꿍 코드 유효성 검증
 */
function handleValidatePartnerCode(payload) {
  const code = (payload.code || "").trim();
  if (!code) {
    return createJsonResponse({
      success: true,
      valid: false,
      code: "",
      discountAmount: 0,
      message: "짝꿍 코드를 입력해 주세요."
    });
  }

  try {
    const sheet = getOrCreatePartnerSheet();
    const data = sheet.getDataRange().getValues();
    let isValid = false;
    let discountAmount = 50000;
    const cleanInput = code.replace(/\s+/g, "").toLowerCase();

    // 헤더(index 0) 제외하고 1행부터 탐색
    for (let i = 1; i < data.length; i++) {
      const rowCode = String(data[i][0] || "").replace(/\s+/g, "").toLowerCase();
      if (rowCode && rowCode === cleanInput) {
        isValid = true;
        if (data[i][1] && !isNaN(Number(data[i][1]))) {
          discountAmount = Number(data[i][1]);
        }
        break;
      }
    }

    if (isValid) {
      return createJsonResponse({
        success: true,
        valid: true,
        code: code,
        discountAmount: discountAmount,
        message: "유효한 짝꿍 코드입니다. 50,000원 할인이 적용되었습니다."
      });
    } else {
      return createJsonResponse({
        success: true,
        valid: false,
        code: code,
        discountAmount: 0,
        message: "등록되지 않은 짝꿍 코드입니다. 대표님께 확인 후 다시 입력해 주세요."
      });
    }
  } catch (err) {
    Logger.log("짝꿍 검증 오류: " + err.toString());
    const fallbackList = ["261011김민수", "261122이지은", "테스트짝꿍"];
    const cleanInput = code.replace(/\s+/g, "").toLowerCase();
    const matched = fallbackList.some(function(c) { return c.toLowerCase() === cleanInput; });
    return createJsonResponse({
      success: true,
      valid: matched,
      code: code,
      discountAmount: matched ? 50000 : 0,
      message: matched ? "유효한 짝꿍 코드입니다. (확인 완료)" : "등록되지 않은 짝꿍 코드입니다."
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


/* fflate (MIT), bundled unzlibSync only.
MIT License

Copyright (c) 2026 Arjun Barrett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var ContractInflate=(()=>{var V=Object.defineProperty;var yr=Object.getOwnPropertyDescriptor;var wr=Object.getOwnPropertyNames;var mr=Object.prototype.hasOwnProperty;var xr=(r,n)=>{for(var t in n)V(r,t,{get:n[t],enumerable:!0})},zr=(r,n,t,a)=>{if(n&&typeof n=="object"||typeof n=="function")for(let e of wr(n))!mr.call(r,e)&&e!==t&&V(r,e,{get:()=>n[e],enumerable:!(a=yr(n,e))||a.enumerable});return r};var Ar=r=>zr(V({},"__esModule",{value:!0}),r);var Lr={};xr(Lr,{unzlibSync:()=>ur});var h=Uint8Array,S=Uint16Array,Mr=Int32Array,er=new h([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),ir=new h([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Sr=new h([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),ar=function(r,n){for(var t=new S(31),a=0;a<31;++a)t[a]=n+=1<<r[a-1];for(var e=new Mr(t[30]),a=1;a<30;++a)for(var c=t[a];c<t[a+1];++c)e[c]=c-t[a]<<5|a;return{b:t,r:e}},or=ar(er,2),sr=or.b,Ur=or.r;sr[28]=258,Ur[258]=28;var fr=ar(ir,0),Fr=fr.b,$r=fr.r,j=new S(32768);for(o=0;o<32768;++o)g=(o&43690)>>1|(o&21845)<<1,g=(g&52428)>>2|(g&13107)<<2,g=(g&61680)>>4|(g&3855)<<4,j[o]=((g&65280)>>8|(g&255)<<8)>>1;var g,o,I=(function(r,n,t){for(var a=r.length,e=0,c=new S(n);e<a;++e)r[e]&&++c[r[e]-1];var y=new S(n);for(e=1;e<n;++e)y[e]=y[e-1]+c[e-1]<<1;var p;if(t){p=new S(1<<n);var z=15-n;for(e=0;e<a;++e)if(r[e])for(var U=e<<4|r[e],w=n-r[e],i=y[r[e]-1]++<<w,s=i|(1<<w)-1;i<=s;++i)p[j[i]>>z]=U}else for(p=new S(a),e=0;e<a;++e)r[e]&&(p[e]=j[y[r[e]-1]++]>>15-r[e]);return p}),B=new h(288);for(o=0;o<144;++o)B[o]=8;var o;for(o=144;o<256;++o)B[o]=9;var o;for(o=256;o<280;++o)B[o]=7;var o;for(o=280;o<288;++o)B[o]=8;var o,hr=new h(32);for(o=0;o<32;++o)hr[o]=5;var o;var Dr=I(B,9,1);var Tr=I(hr,5,1),W=function(r){for(var n=r[0],t=1;t<r.length;++t)r[t]>n&&(n=r[t]);return n},u=function(r,n,t){var a=n/8|0;return(r[a]|r[a+1]<<8)>>(n&7)&t},Y=function(r,n){var t=n/8|0;return(r[t]|r[t+1]<<8|r[t+2]<<16)>>(n&7)},Cr=function(r){return(r+7)/8|0},Ir=function(r,n,t){return(n==null||n<0)&&(n=0),(t==null||t>r.length)&&(t=r.length),new h(r.subarray(n,t))};var Br=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],l=function(r,n,t){var a=new Error(n||Br[r]);if(a.code=r,Error.captureStackTrace&&Error.captureStackTrace(a,l),!t)throw a;return a},Zr=function(r,n,t,a){var e=r.length,c=a?a.length:0;if(!e||n.f&&!n.l)return t||new h(0);var y=!t,p=y||n.i!=2,z=n.i;y&&(t=new h(e*3));var U=function(rr){var nr=t.length;if(rr>nr){var tr=new h(Math.max(nr*2,rr));tr.set(t),t=tr}},w=n.f||0,i=n.p||0,s=n.b||0,x=n.l,Z=n.d,F=n.m,D=n.n,G=e*8;do{if(!x){w=u(r,i,1);var O=u(r,i+1,3);if(i+=3,O)if(O==1)x=Dr,Z=Tr,F=9,D=5;else if(O==2){var P=u(r,i,31)+257,J=u(r,i+10,15)+4,K=P+u(r,i+5,31)+1;i+=14;for(var T=new h(K),$=new h(19),f=0;f<J;++f)$[Sr[f]]=u(r,i+f*3,7);i+=J*3;for(var Q=W($),lr=(1<<Q)-1,vr=I($,Q,1),f=0;f<K;){var X=vr[u(r,i,lr)];i+=X&15;var v=X>>4;if(v<16)T[f++]=v;else{var A=0,E=0;for(v==16?(E=3+u(r,i,3),i+=2,A=T[f-1]):v==17?(E=3+u(r,i,7),i+=3):v==18&&(E=11+u(r,i,127),i+=7);E--;)T[f++]=A}}var k=T.subarray(0,P),m=T.subarray(P);F=W(k),D=W(m),x=I(k,F,1),Z=I(m,D,1)}else l(1);else{var v=Cr(i)+4,q=r[v-4]|r[v-3]<<8,L=v+q;if(L>e){z&&l(0);break}p&&U(s+q),t.set(r.subarray(v,L),s),n.b=s+=q,n.p=i=L*8,n.f=w;continue}if(i>G){z&&l(0);break}}p&&U(s+131072);for(var cr=(1<<F)-1,pr=(1<<D)-1,H=i;;H=i){var A=x[Y(r,i)&cr],M=A>>4;if(i+=A&15,i>G){z&&l(0);break}if(A||l(2),M<256)t[s++]=M;else if(M==256){H=i,x=null;break}else{var d=M-254;if(M>264){var f=M-257,C=er[f];d=u(r,i,(1<<C)-1)+sr[f],i+=C}var N=Z[Y(r,i)&pr],R=N>>4;N||l(3),i+=N&15;var m=Fr[R];if(R>3){var C=ir[R];m+=Y(r,i)&(1<<C)-1,i+=C}if(i>G){z&&l(0);break}p&&U(s+131072);var b=s+d;if(s<m){var _=c-m,gr=Math.min(m,b);for(_+s<0&&l(3);s<gr;++s)t[s]=a[_+s]}for(;s<b;++s)t[s]=t[s-m]}}n.l=x,n.p=H,n.b=s,n.f=w,x&&(w=1,n.m=F,n.d=Z,n.n=D)}while(!w);return s!=t.length&&y?Ir(t,0,s):t.subarray(0,s)};var Er=new h(0);var Gr=function(r,n){return((r[0]&15)!=8||r[0]>>4>7||(r[0]<<8|r[1])%31)&&l(6,"invalid zlib data"),(r[1]>>5&1)==+!n&&l(6,"invalid zlib data: "+(r[1]&32?"need":"unexpected")+" dictionary"),(r[1]>>3&4)+2};function ur(r,n){return Zr(r.subarray(Gr(r,n&&n.dictionary),-4),{i:2},n&&n.out,n&&n.dictionary)}var Or=typeof TextDecoder<"u"&&new TextDecoder,qr=0;try{Or.decode(Er,{stream:!0}),qr=1}catch{}return Ar(Lr);})();

/**
 * Lossless images from THIS app's two-page jsPDF raster contract.
 * No Drive export, external service, new OAuth scope or frontend deployment.
 * Deliberately rejects other PDF structures instead of saving an incomplete form.
 */
function contractPdfPageImages(pdfBlob) {
  if (!pdfBlob) throw new Error('양식 보존용 원본 PDF가 없습니다.');
  const bytes = new Uint8Array(pdfBlob.getBytes());
  if (bytes.length > 20000000) throw new Error('계약서 PDF가 너무 큽니다.');
  let text = '';
  for (let at = 0; at < bytes.length; at += 8192) {
    text += String.fromCharCode.apply(null, bytes.subarray(at, at + 8192));
  }
  const tail = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(text);
  if (!tail || text.substring(0, 5) !== '%PDF-') throw new Error('PDF 형식을 확인할 수 없습니다.');
  const xref = text.substring(Number(tail[1]));
  const head = /^xref\s+0\s+(\d+)\s*\r?\n/.exec(xref);
  if (!head || Number(head[1]) > 1000) throw new Error('지원하지 않는 PDF 참조 형식입니다.');
  const lines = xref.substring(head[0].length).split(/\r?\n/);
  const offsets = {};
  for (let i = 0; i < Number(head[1]); i++) {
    const line = /^(\d{10})\s+(\d{5})\s+([nf])/.exec(lines[i] || '');
    if (!line) throw new Error('PDF 참조표가 손상되었습니다.');
    if (line[3] === 'n') offsets[i] = Number(line[1]);
  }
  function object(id) {
    const start = offsets[id];
    if (!start || text.substring(start, start + String(id).length + 6) !== id + ' 0 obj') {
      throw new Error('PDF 개체를 찾을 수 없습니다.');
    }
    const end = text.indexOf('endobj', start);
    const stream = /stream\r?\n/.exec(text.substring(start, end));
    const dictionary = text.substring(start, stream ? start + stream.index : end);
    if (!stream) return { dictionary: dictionary, bytes: null };
    const length = /\/Length\s+(\d+)\s*(?:\/|>>)/.exec(dictionary);
    if (!length) throw new Error('PDF 스트림 길이를 확인할 수 없습니다.');
    const from = start + stream.index + stream[0].length;
    const to = from + Number(length[1]);
    if (to > bytes.length || !/^\r?\nendstream/.test(text.substring(to, to + 16))) {
      throw new Error('PDF 스트림이 손상되었습니다.');
    }
    return { dictionary: dictionary, bytes: bytes.subarray(from, to) };
  }
  function ref(dictionary, name) {
    const match = new RegExp('/' + name + '\\s+(\\d+) 0 R').exec(dictionary);
    if (!match) throw new Error('PDF ' + name + ' 항목이 없습니다.');
    return Number(match[1]);
  }
  function number(dictionary, name) {
    const m = new RegExp('/' + name + '\\s+(\\d+)').exec(dictionary);
    return m ? Number(m[1]) : 0;
  }
  const root = object(ref(xref, 'Root'));
  const pages = object(ref(root.dictionary, 'Pages'));
  const kids = /\/Kids\s*\[([^\]]+)\]/.exec(pages.dictionary);
  const ids = kids && kids[1].match(/\d+ 0 R/g);
  if (number(pages.dictionary, 'Count') !== 2 || !ids || ids.length !== 2) {
    throw new Error('본문과 약관 2페이지 PDF만 양식 보존을 지원합니다.');
  }
  return ids.map(function(id, index) {
    const page = object(Number(id.split(' ')[0]));
    const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(page.dictionary);
    if (!box || Math.abs(Number(box[1]) - 595.28) > 1 || Math.abs(Number(box[2]) - 841.89) > 1) {
      throw new Error('A4 계약서가 아닙니다.');
    }
    const contentObj = object(ref(page.dictionary, 'Contents'));
    const contentBytes = /\/FlateDecode\b/.test(contentObj.dictionary)
      ? ContractInflate.unzlibSync(contentObj.bytes) : contentObj.bytes;
    if (!contentBytes || contentBytes.length > 2000) throw new Error('지원하지 않는 PDF 페이지입니다.');
    const content = String.fromCharCode.apply(null, contentBytes);
    const image = /q\s+([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm\s+\/(I\d+) Do\s+Q/.exec(content);
    if (!image || (content.match(/\bDo\b/g) || []).length !== 1) throw new Error('PDF 원본 이미지가 하나가 아닙니다.');
    if (Number(image[1]) <= 0 || Number(image[2]) <= 0
      || Number(image[3]) + Number(image[1]) > Number(box[1]) + 0.1
      || Number(image[4]) + Number(image[2]) > Number(box[2]) + 0.1) {
      throw new Error('PDF 원본 이미지가 A4 영역을 초과합니다.');
    }
    const footer = '(' + (index + 1) + ' / 2) Tj';
    if (content.indexOf(footer) === -1) throw new Error('PDF 페이지 순서를 확인할 수 없습니다.');
    // Reject unhandled painting/text so a newer PDF format cannot silently lose content.
    const remaining = content.replace(image[0], '').replace(/BT[\s\S]*?ET/, '').trim();
    if (!/^[\d.]+ w\s+0 G$/.test(remaining) || (content.match(/\bBT\b/g) || []).length !== 1) {
      throw new Error('PDF에 지원하지 않는 추가 내용이 있습니다.');
    }
    const resources = object(ref(page.dictionary, 'Resources'));
    const raw = object(ref(resources.dictionary, image[5]));
    const dict = raw.dictionary;
    const width = number(dict, 'Width'), height = number(dict, 'Height');
    if (!raw.bytes || !/\/ColorSpace\s*\/DeviceRGB\b/.test(dict)
      || !/\/Filter\s*\/FlateDecode\b/.test(dict) || number(dict, 'BitsPerComponent') !== 8
      || number(dict, 'Colors') !== 3 || number(dict, 'Columns') !== width
      || number(dict, 'Predictor') < 10 || number(dict, 'Predictor') > 15
      || width < 1 || height < 1 || width * height > 20000000) {
      throw new Error('지원하지 않는 PDF 이미지 형식입니다.');
    }
    if (/\/SMask\b/.test(dict)) {
      const mask = object(ref(dict, 'SMask'));
      if (number(mask.dictionary, 'Width') !== width || number(mask.dictionary, 'Height') !== height
        || number(mask.dictionary, 'Colors') !== 1 || !/\/FlateDecode\b/.test(mask.dictionary)) {
        throw new Error('PDF 투명도를 확인할 수 없습니다.');
      }
      contractPdfAssertOpaque(ContractInflate.unzlibSync(mask.bytes), width, height);
    }
    return {
      png: contractPdfPng(raw.bytes, width, height),
      widthPx: Number(image[1]) * 4 / 3,
      heightPx: Number(image[2]) * 4 / 3,
      leftPx: Number(image[3]) * 4 / 3,
      topPx: (Number(box[2]) - Number(image[2]) - Number(image[4])) * 4 / 3,
    };
  });
}

function contractPdfAssertOpaque(data, width, height) {
  if (data.length !== (width + 1) * height) throw new Error('PDF 투명도 크기가 다릅니다.');
  let at = 0;
  for (let y = 0; y < height; y++) {
    const filter = data[at++];
    if (filter > 4) throw new Error('PDF 투명도 필터가 잘못되었습니다.');
    for (let x = 0; x < width; x++) {
      const left = x ? 255 : 0, up = y ? 255 : 0, diagonal = x && y ? 255 : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      if (filter === 2) predictor = up;
      if (filter === 3) predictor = Math.floor((left + up) / 2);
      if (filter === 4) {
        const p = left + up - diagonal;
        const a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - diagonal);
        predictor = a <= b && a <= c ? left : b <= c ? up : diagonal;
      }
      if (((data[at++] + predictor) & 255) !== 255) {
        throw new Error('투명 PDF 이미지는 양식 보존을 지원하지 않습니다.');
      }
    }
  }
}

function contractPdfPng(compressed, width, height) {
  function uint32(value) { return [value >>> 24, value >>> 16 & 255, value >>> 8 & 255, value & 255]; }
  function chunk(type, data) {
    const payload = new Uint8Array(4 + data.length);
    for (let i = 0; i < 4; i++) payload[i] = type.charCodeAt(i);
    payload.set(data, 4);
    let crc = 0xffffffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload[i];
      for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0);
    }
    const out = new Uint8Array(data.length + 12);
    out.set(uint32(data.length)); out.set(payload, 4); out.set(uint32((crc ^ 0xffffffff) >>> 0), 8 + data.length);
    return out;
  }
  const ihdr = new Uint8Array(uint32(width).concat(uint32(height), [8, 2, 0, 0, 0]));
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', new Uint8Array(0))];
  const result = new Uint8Array(parts.reduce(function(n, part) { return n + part.length; }, 0));
  let offset = 0; parts.forEach(function(part) { result.set(part, offset); offset += part.length; });
  return result;
}

/** Generated with @oai/artifact-tool. See scripts/build-contract-excel-template.mjs. */
function contractExcelTemplate() { return {"xml":{"xl/workbook.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><x:workbook xmlns:x=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><x:sheets><x:sheet name=\"계약서\" sheetId=\"1\" r:id=\"R3786510f0a4d439f\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" /><x:sheet name=\"약관\" sheetId=\"2\" r:id=\"Race3e1b73750413f\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" /><x:sheet name=\"계약정보\" sheetId=\"3\" r:id=\"R2cb0c6b7fafd4507\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" /></x:sheets><x:definedNames><x:definedName name=\"_xlnm.Print_Area\" localSheetId=\"0\">&apos;계약서&apos;!$A$1:$L$60</x:definedName><x:definedName name=\"_xlnm.Print_Area\" localSheetId=\"1\">&apos;약관&apos;!$A$1:$L$60</x:definedName></x:definedNames></x:workbook>","xl/styles.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><x:styleSheet xmlns:x=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><x:numFmts count=\"1\"><x:numFmt numFmtId=\"200\" formatCode=\"#,##0\" /></x:numFmts><x:fonts count=\"3\"><x:font><x:sz val=\"11\" /><x:name val=\"Carlito\" /></x:font><x:font><x:sz val=\"11\" /><x:name val=\"맑은 고딕\" /></x:font><x:font><x:b /><x:sz val=\"11\" /><x:color rgb=\"FFFFFFFF\" /><x:name val=\"맑은 고딕\" /></x:font></x:fonts><x:fills count=\"3\"><x:fill><x:patternFill patternType=\"none\" /></x:fill><x:fill><x:patternFill patternType=\"gray125\" /></x:fill><x:fill><x:patternFill patternType=\"solid\"><x:fgColor rgb=\"FF322A1B\" /></x:patternFill></x:fill></x:fills><x:borders count=\"1\"><x:border><x:left /><x:right /><x:top /><x:bottom /><x:diagonal /></x:border></x:borders><x:cellStyleXfs count=\"1\"><x:xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" /></x:cellStyleXfs><x:cellXfs count=\"7\"><x:xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" /><x:xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" /><x:xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><x:alignment wrapText=\"1\" /></x:xf><x:xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><x:alignment vertical=\"top\" wrapText=\"1\" /></x:xf><x:xf numFmtId=\"0\" fontId=\"1\" fillId=\"2\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><x:alignment vertical=\"top\" wrapText=\"1\" /></x:xf><x:xf numFmtId=\"0\" fontId=\"2\" fillId=\"2\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><x:alignment vertical=\"top\" wrapText=\"1\" /></x:xf><x:xf numFmtId=\"200\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyNumberFormat=\"1\" applyFont=\"1\" applyFill=\"1\" applyBorder=\"1\" applyAlignment=\"1\"><x:alignment vertical=\"top\" wrapText=\"1\" /></x:xf></x:cellXfs><x:cellStyles count=\"1\"><x:cellStyle name=\"Normal\" xfId=\"0\" /></x:cellStyles></x:styleSheet>","xl/theme/theme1.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><a:theme name=\"ChatGPT\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\"><a:themeElements><a:clrScheme name=\"ChatGPT\"><a:dk1><a:sysClr val=\"windowText\" lastClr=\"000000\" /></a:dk1><a:lt1><a:sysClr val=\"window\" lastClr=\"FFFFFF\" /></a:lt1><a:dk2><a:srgbClr val=\"0E2841\" /></a:dk2><a:lt2><a:srgbClr val=\"E8E8E8\" /></a:lt2><a:accent1><a:srgbClr val=\"156082\" /></a:accent1><a:accent2><a:srgbClr val=\"E97132\" /></a:accent2><a:accent3><a:srgbClr val=\"196B24\" /></a:accent3><a:accent4><a:srgbClr val=\"0F9ED5\" /></a:accent4><a:accent5><a:srgbClr val=\"A02B93\" /></a:accent5><a:accent6><a:srgbClr val=\"4EA72E\" /></a:accent6><a:hlink><a:srgbClr val=\"467886\" /></a:hlink><a:folHlink><a:srgbClr val=\"96607D\" /></a:folHlink></a:clrScheme><a:fontScheme name=\"Office\"><a:majorFont><a:latin typeface=\"Calibri Light\" /><a:ea typeface=\"Calibri Light\" /><a:cs typeface=\"Calibri Light\" /></a:majorFont><a:minorFont><a:latin typeface=\"Calibri\" /><a:ea typeface=\"Calibri\" /><a:cs typeface=\"Calibri\" /></a:minorFont></a:fontScheme><a:fmtScheme name=\"ChatGPT\"><a:fillStyleLst><a:solidFill><a:schemeClr val=\"phClr\" /></a:solidFill><a:gradFill><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"67000\" /><a:lumMod val=\"110000\" /><a:satMod val=\"105000\" /></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:tint val=\"73000\" /><a:lumMod val=\"105000\" /><a:satMod val=\"103000\" /></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:tint val=\"81000\" /><a:lumMod val=\"105000\" /><a:satMod val=\"109000\" /></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\" /></a:gradFill><a:gradFill><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"94000\" /><a:lumMod val=\"102000\" /><a:satMod val=\"103000\" /></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:shade val=\"100000\" /><a:lumMod val=\"100000\" /><a:satMod val=\"110000\" /></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"78000\" /><a:lumMod val=\"99000\" /><a:satMod val=\"120000\" /></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\" /></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w=\"12700\"><a:solidFill><a:schemeClr val=\"phClr\" /></a:solidFill><a:prstDash val=\"solid\" /></a:ln><a:ln w=\"19050\"><a:solidFill><a:schemeClr val=\"phClr\" /></a:solidFill><a:prstDash val=\"solid\" /></a:ln><a:ln w=\"25400\"><a:solidFill><a:schemeClr val=\"phClr\" /></a:solidFill><a:prstDash val=\"solid\" /></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst /></a:effectStyle><a:effectStyle><a:effectLst /></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad=\"57150\" dist=\"19050\" dir=\"5400000\"><a:srgbClr val=\"000000\"><a:alpha val=\"63000\" /></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val=\"phClr\" /></a:solidFill><a:solidFill><a:schemeClr val=\"phClr\"><a:tint val=\"95000\" /><a:satMod val=\"170000\" /></a:schemeClr></a:solidFill><a:gradFill><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"93000\" /><a:shade val=\"98000\" /><a:lumMod val=\"102000\" /><a:satMod val=\"150000\" /></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:tint val=\"98000\" /><a:shade val=\"90000\" /><a:lumMod val=\"103000\" /><a:satMod val=\"130000\" /></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"63000\" /><a:satMod val=\"120000\" /></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\" /></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>","xl/sharedStrings.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><x:sst xmlns:x=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" />","xl/worksheets/sheet1.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><x:worksheet xmlns:x=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><x:sheetPr><x:pageSetUpPr fitToPage=\"1\"/></x:sheetPr><x:sheetViews><x:sheetView showGridLines=\"0\" workbookViewId=\"0\" /></x:sheetViews><x:sheetFormatPr defaultRowHeight=\"15\" /><x:cols><x:col min=\"1\" max=\"1\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"2\" max=\"2\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"3\" max=\"3\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"4\" max=\"4\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"5\" max=\"5\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"6\" max=\"6\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"7\" max=\"7\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"8\" max=\"8\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"9\" max=\"9\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"10\" max=\"10\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"11\" max=\"11\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"12\" max=\"12\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /></x:cols><x:sheetData><x:row r=\"1\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"2\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"3\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"4\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"5\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"6\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"7\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"8\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"9\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"10\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"11\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"12\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"13\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"14\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"15\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"16\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"17\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"18\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"19\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"20\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"21\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"22\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"23\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"24\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"25\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"26\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"27\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"28\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"29\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"30\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"31\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"32\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"33\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"34\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"35\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"36\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"37\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"38\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"39\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"40\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"41\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"42\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"43\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"44\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"45\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"46\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"47\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"48\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"49\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"50\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"51\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"52\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"53\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"54\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"55\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"56\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"57\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"58\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"59\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"60\" ht=\"14.031499862670898\" customHeight=\"1\" /></x:sheetData><x:printOptions horizontalCentered=\"0\"/><x:pageMargins left=\"0\" right=\"0\" top=\"0\" bottom=\"0\" header=\"0\" footer=\"0\"/><x:pageSetup paperSize=\"9\" orientation=\"portrait\" fitToWidth=\"1\" fitToHeight=\"1\"/><x:drawing r:id=\"R52d0233913904c67\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" /></x:worksheet>","xl/drawings/drawing1.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><xdr:wsDr xmlns:xdr=\"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing\"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx=\"7560000\" cy=\"10691184\" /><xdr:pic><xdr:nvPicPr><xdr:cNvPr id=\"1\" name=\"27b65018-4c5a-4d60-9f0c-42933ece88b2\" /><xdr:cNvPicPr><a:picLocks noChangeAspect=\"1\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed=\"Rf9482ae74c8b4227\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /><a:stretch xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\"><a:fillRect /></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst=\"rect\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:spPr></xdr:pic><xdr:clientData /></xdr:oneCellAnchor><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx=\"7562850\" cy=\"10693400\" /><xdr:pic><xdr:nvPicPr><xdr:cNvPr id=\"2\" name=\"50b570d8-55f2-4897-b6f0-fdca01d04c37\" /><xdr:cNvPicPr><a:picLocks noChangeAspect=\"1\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed=\"R513b9573ebcc4028\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /><a:stretch xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\"><a:fillRect /></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst=\"rect\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:spPr></xdr:pic><xdr:clientData /></xdr:oneCellAnchor></xdr:wsDr>","xl/worksheets/sheet2.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><x:worksheet xmlns:x=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><x:sheetPr><x:pageSetUpPr fitToPage=\"1\"/></x:sheetPr><x:sheetViews><x:sheetView showGridLines=\"0\" workbookViewId=\"0\" /></x:sheetViews><x:sheetFormatPr defaultRowHeight=\"15\" /><x:cols><x:col min=\"1\" max=\"1\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"2\" max=\"2\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"3\" max=\"3\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"4\" max=\"4\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"5\" max=\"5\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"6\" max=\"6\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"7\" max=\"7\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"8\" max=\"8\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"9\" max=\"9\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"10\" max=\"10\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"11\" max=\"11\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"12\" max=\"12\" width=\"7.349999904632568\" hidden=\"0\" customWidth=\"1\" /></x:cols><x:sheetData><x:row r=\"1\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"2\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"3\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"4\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"5\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"6\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"7\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"8\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"9\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"10\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"11\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"12\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"13\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"14\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"15\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"16\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"17\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"18\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"19\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"20\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"21\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"22\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"23\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"24\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"25\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"26\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"27\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"28\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"29\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"30\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"31\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"32\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"33\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"34\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"35\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"36\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"37\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"38\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"39\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"40\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"41\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"42\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"43\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"44\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"45\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"46\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"47\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"48\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"49\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"50\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"51\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"52\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"53\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"54\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"55\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"56\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"57\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"58\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"59\" ht=\"14.031499862670898\" customHeight=\"1\" /><x:row r=\"60\" ht=\"14.031499862670898\" customHeight=\"1\" /></x:sheetData><x:printOptions horizontalCentered=\"0\"/><x:pageMargins left=\"0\" right=\"0\" top=\"0\" bottom=\"0\" header=\"0\" footer=\"0\"/><x:pageSetup paperSize=\"9\" orientation=\"portrait\" fitToWidth=\"1\" fitToHeight=\"1\"/><x:drawing r:id=\"R6fec3c988a4e4e9d\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" /></x:worksheet>","xl/drawings/drawing2.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><xdr:wsDr xmlns:xdr=\"http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing\"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx=\"7560000\" cy=\"10691184\" /><xdr:pic><xdr:nvPicPr><xdr:cNvPr id=\"1\" name=\"2785e0c7-574b-4080-a794-6e157c9553d1\" /><xdr:cNvPicPr><a:picLocks noChangeAspect=\"1\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed=\"R36dc2698baf34294\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /><a:stretch xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\"><a:fillRect /></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst=\"rect\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:spPr></xdr:pic><xdr:clientData /></xdr:oneCellAnchor><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx=\"7562850\" cy=\"10693400\" /><xdr:pic><xdr:nvPicPr><xdr:cNvPr id=\"2\" name=\"b3a276b4-9cb5-4781-907f-dec8954669c3\" /><xdr:cNvPicPr><a:picLocks noChangeAspect=\"1\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed=\"Rd83fbe12769141f5\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /><a:stretch xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\"><a:fillRect /></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst=\"rect\" xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" /></xdr:spPr></xdr:pic><xdr:clientData /></xdr:oneCellAnchor></xdr:wsDr>","xl/worksheets/sheet3.xml":"<?xml version=\"1.0\" encoding=\"utf-8\"?><x:worksheet xmlns:x=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><x:sheetViews><x:sheetView showGridLines=\"0\" workbookViewId=\"0\"><x:pane ySplit=\"1\" topLeftCell=\"A2\" activePane=\"bottomLeft\" state=\"frozen\" /></x:sheetView></x:sheetViews><x:sheetFormatPr defaultRowHeight=\"15\" /><x:cols><x:col min=\"1\" max=\"1\" width=\"32\" hidden=\"0\" customWidth=\"1\" /><x:col min=\"2\" max=\"2\" width=\"85\" hidden=\"0\" customWidth=\"1\" /></x:cols><x:sheetData><x:row r=\"1\" ht=\"30\" customHeight=\"1\"><x:c r=\"A1\" s=\"5\" t=\"str\"><x:v>__DM_0_0__</x:v></x:c><x:c r=\"B1\" s=\"5\" t=\"str\"><x:v>__DM_0_1__</x:v></x:c></x:row><x:row r=\"2\" ht=\"30\" customHeight=\"1\"><x:c r=\"A2\" s=\"3\" t=\"str\"><x:v>__DM_1_0__</x:v></x:c><x:c r=\"B2\" s=\"3\" t=\"str\"><x:v>__DM_1_1__</x:v></x:c></x:row><x:row r=\"3\" ht=\"30\" customHeight=\"1\"><x:c r=\"A3\" s=\"3\" t=\"str\"><x:v>__DM_2_0__</x:v></x:c><x:c r=\"B3\" s=\"3\" t=\"str\"><x:v>__DM_2_1__</x:v></x:c></x:row><x:row r=\"4\" ht=\"30\" customHeight=\"1\"><x:c r=\"A4\" s=\"3\" t=\"str\"><x:v>__DM_3_0__</x:v></x:c><x:c r=\"B4\" s=\"3\" t=\"str\"><x:v>__DM_3_1__</x:v></x:c></x:row><x:row r=\"5\" ht=\"30\" customHeight=\"1\"><x:c r=\"A5\" s=\"3\" t=\"str\"><x:v>__DM_4_0__</x:v></x:c><x:c r=\"B5\" s=\"3\" t=\"str\"><x:v>__DM_4_1__</x:v></x:c></x:row><x:row r=\"6\" ht=\"30\" customHeight=\"1\"><x:c r=\"A6\" s=\"3\" t=\"str\"><x:v>__DM_5_0__</x:v></x:c><x:c r=\"B6\" s=\"3\" t=\"str\"><x:v>__DM_5_1__</x:v></x:c></x:row><x:row r=\"7\" ht=\"30\" customHeight=\"1\"><x:c r=\"A7\" s=\"3\" t=\"str\"><x:v>__DM_6_0__</x:v></x:c><x:c r=\"B7\" s=\"3\" t=\"str\"><x:v>__DM_6_1__</x:v></x:c></x:row><x:row r=\"8\" ht=\"30\" customHeight=\"1\"><x:c r=\"A8\" s=\"3\" t=\"str\"><x:v>__DM_7_0__</x:v></x:c><x:c r=\"B8\" s=\"3\" t=\"str\"><x:v>__DM_7_1__</x:v></x:c></x:row><x:row r=\"9\" ht=\"30\" customHeight=\"1\"><x:c r=\"A9\" s=\"3\" t=\"str\"><x:v>__DM_8_0__</x:v></x:c><x:c r=\"B9\" s=\"3\" t=\"str\"><x:v>__DM_8_1__</x:v></x:c></x:row><x:row r=\"10\" ht=\"30\" customHeight=\"1\"><x:c r=\"A10\" s=\"3\" t=\"str\"><x:v>__DM_9_0__</x:v></x:c><x:c r=\"B10\" s=\"3\" t=\"str\"><x:v>__DM_9_1__</x:v></x:c></x:row><x:row r=\"11\" ht=\"30\" customHeight=\"1\"><x:c r=\"A11\" s=\"3\" t=\"str\"><x:v>__DM_10_0__</x:v></x:c><x:c r=\"B11\" s=\"3\" t=\"str\"><x:v>__DM_10_1__</x:v></x:c></x:row><x:row r=\"12\" ht=\"30\" customHeight=\"1\"><x:c r=\"A12\" s=\"3\" t=\"str\"><x:v>__DM_11_0__</x:v></x:c><x:c r=\"B12\" s=\"3\" t=\"str\"><x:v>__DM_11_1__</x:v></x:c></x:row><x:row r=\"13\" ht=\"30\" customHeight=\"1\"><x:c r=\"A13\" s=\"3\" t=\"str\"><x:v>__DM_12_0__</x:v></x:c><x:c r=\"B13\" s=\"3\" t=\"str\"><x:v>__DM_12_1__</x:v></x:c></x:row><x:row r=\"14\" ht=\"30\" customHeight=\"1\"><x:c r=\"A14\" s=\"3\" t=\"str\"><x:v>__DM_13_0__</x:v></x:c><x:c r=\"B14\" s=\"3\" t=\"str\"><x:v>__DM_13_1__</x:v></x:c></x:row><x:row r=\"15\" ht=\"30\" customHeight=\"1\"><x:c r=\"A15\" s=\"3\" t=\"str\"><x:v>__DM_14_0__</x:v></x:c><x:c r=\"B15\" s=\"3\" t=\"str\"><x:v>__DM_14_1__</x:v></x:c></x:row><x:row r=\"16\" ht=\"30\" customHeight=\"1\"><x:c r=\"A16\" s=\"3\" t=\"str\"><x:v>__DM_15_0__</x:v></x:c><x:c r=\"B16\" s=\"3\" t=\"str\"><x:v>__DM_15_1__</x:v></x:c></x:row><x:row r=\"17\" ht=\"30\" customHeight=\"1\"><x:c r=\"A17\" s=\"3\" t=\"str\"><x:v>__DM_16_0__</x:v></x:c><x:c r=\"B17\" s=\"3\" t=\"str\"><x:v>__DM_16_1__</x:v></x:c></x:row><x:row r=\"18\" ht=\"30\" customHeight=\"1\"><x:c r=\"A18\" s=\"3\" t=\"str\"><x:v>__DM_17_0__</x:v></x:c><x:c r=\"B18\" s=\"3\" t=\"str\"><x:v>__DM_17_1__</x:v></x:c></x:row><x:row r=\"19\" ht=\"30\" customHeight=\"1\"><x:c r=\"A19\" s=\"3\" t=\"str\"><x:v>__DM_18_0__</x:v></x:c><x:c r=\"B19\" s=\"3\" t=\"str\"><x:v>__DM_18_1__</x:v></x:c></x:row><x:row r=\"20\" ht=\"30\" customHeight=\"1\"><x:c r=\"A20\" s=\"3\" t=\"str\"><x:v>__DM_19_0__</x:v></x:c><x:c r=\"B20\" s=\"3\" t=\"str\"><x:v>__DM_19_1__</x:v></x:c></x:row><x:row r=\"21\" ht=\"30\" customHeight=\"1\"><x:c r=\"A21\" s=\"3\" t=\"str\"><x:v>__DM_20_0__</x:v></x:c><x:c r=\"B21\" s=\"3\" t=\"str\"><x:v>__DM_20_1__</x:v></x:c></x:row><x:row r=\"22\" ht=\"30\" customHeight=\"1\"><x:c r=\"A22\" s=\"3\" t=\"str\"><x:v>__DM_21_0__</x:v></x:c><x:c r=\"B22\" s=\"3\" t=\"str\"><x:v>__DM_21_1__</x:v></x:c></x:row><x:row r=\"23\" ht=\"30\" customHeight=\"1\"><x:c r=\"A23\" s=\"3\" t=\"str\"><x:v>__DM_22_0__</x:v></x:c><x:c r=\"B23\" s=\"3\" t=\"str\"><x:v>__DM_22_1__</x:v></x:c></x:row><x:row r=\"24\" ht=\"30\" customHeight=\"1\"><x:c r=\"A24\" s=\"3\" t=\"str\"><x:v>__DM_23_0__</x:v></x:c><x:c r=\"B24\" s=\"3\" t=\"str\"><x:v>__DM_23_1__</x:v></x:c></x:row><x:row r=\"25\" ht=\"30\" customHeight=\"1\"><x:c r=\"A25\" s=\"3\" t=\"str\"><x:v>__DM_24_0__</x:v></x:c><x:c r=\"B25\" s=\"3\" t=\"str\"><x:v>__DM_24_1__</x:v></x:c></x:row><x:row r=\"26\" ht=\"30\" customHeight=\"1\"><x:c r=\"A26\" s=\"3\" t=\"str\"><x:v>__DM_25_0__</x:v></x:c><x:c r=\"B26\" s=\"3\" t=\"str\"><x:v>__DM_25_1__</x:v></x:c></x:row><x:row r=\"27\" ht=\"30\" customHeight=\"1\"><x:c r=\"A27\" s=\"3\" t=\"str\"><x:v>__DM_26_0__</x:v></x:c><x:c r=\"B27\" s=\"3\" t=\"str\"><x:v>__DM_26_1__</x:v></x:c></x:row><x:row r=\"28\" ht=\"30\" customHeight=\"1\"><x:c r=\"A28\" s=\"5\" t=\"str\"><x:v>__DM_27_0__</x:v></x:c><x:c r=\"B28\" s=\"5\" t=\"str\"><x:v>__DM_27_1__</x:v></x:c></x:row><x:row r=\"29\" ht=\"30\" customHeight=\"1\"><x:c r=\"A29\" s=\"3\" t=\"str\"><x:v>__DM_28_0__</x:v></x:c><x:c r=\"B29\" s=\"6\" t=\"str\"><x:v>__DM_28_1__</x:v></x:c></x:row><x:row r=\"30\" ht=\"30\" customHeight=\"1\"><x:c r=\"A30\" s=\"3\" t=\"str\"><x:v>__DM_29_0__</x:v></x:c><x:c r=\"B30\" s=\"6\" t=\"str\"><x:v>__DM_29_1__</x:v></x:c></x:row><x:row r=\"31\" ht=\"30\" customHeight=\"1\"><x:c r=\"A31\" s=\"3\" t=\"str\"><x:v>__DM_30_0__</x:v></x:c><x:c r=\"B31\" s=\"6\" t=\"str\"><x:v>__DM_30_1__</x:v></x:c></x:row><x:row r=\"32\" ht=\"30\" customHeight=\"1\"><x:c r=\"A32\" s=\"3\" t=\"str\"><x:v>__DM_31_0__</x:v></x:c><x:c r=\"B32\" s=\"6\" t=\"str\"><x:v>__DM_31_1__</x:v></x:c></x:row><x:row r=\"33\" ht=\"30\" customHeight=\"1\"><x:c r=\"A33\" s=\"3\" t=\"str\"><x:v>__DM_32_0__</x:v></x:c><x:c r=\"B33\" s=\"6\" t=\"str\"><x:v>__DM_32_1__</x:v></x:c></x:row><x:row r=\"34\" ht=\"30\" customHeight=\"1\"><x:c r=\"A34\" s=\"3\" t=\"str\"><x:v>__DM_33_0__</x:v></x:c><x:c r=\"B34\" s=\"6\" t=\"str\"><x:v>__DM_33_1__</x:v></x:c></x:row><x:row r=\"35\" ht=\"30\" customHeight=\"1\"><x:c r=\"A35\" s=\"3\" t=\"str\"><x:v>__DM_34_0__</x:v></x:c><x:c r=\"B35\" s=\"3\" t=\"str\"><x:v>__DM_34_1__</x:v></x:c></x:row><x:row r=\"36\" ht=\"30\" customHeight=\"1\"><x:c r=\"A36\" s=\"3\" t=\"str\"><x:v>__DM_35_0__</x:v></x:c><x:c r=\"B36\" s=\"6\" t=\"str\"><x:v>__DM_35_1__</x:v></x:c></x:row><x:row r=\"37\" ht=\"30\" customHeight=\"1\"><x:c r=\"A37\" s=\"3\" t=\"str\"><x:v>__DM_36_0__</x:v></x:c><x:c r=\"B37\" s=\"6\" t=\"str\"><x:v>__DM_36_1__</x:v></x:c></x:row><x:row r=\"38\" ht=\"30\" customHeight=\"1\"><x:c r=\"A38\" s=\"3\" t=\"str\"><x:v>__DM_37_0__</x:v></x:c><x:c r=\"B38\" s=\"6\" t=\"str\"><x:v>__DM_37_1__</x:v></x:c></x:row><x:row r=\"39\" ht=\"30\" customHeight=\"1\"><x:c r=\"A39\" s=\"3\" t=\"str\"><x:v>__DM_38_0__</x:v></x:c><x:c r=\"B39\" s=\"6\" t=\"str\"><x:v>__DM_38_1__</x:v></x:c></x:row><x:row r=\"40\" ht=\"30\" customHeight=\"1\"><x:c r=\"A40\" s=\"3\" t=\"str\"><x:v>__DM_39_0__</x:v></x:c><x:c r=\"B40\" s=\"6\" t=\"str\"><x:v>__DM_39_1__</x:v></x:c></x:row><x:row r=\"41\" ht=\"30\" customHeight=\"1\"><x:c r=\"A41\" s=\"3\" t=\"str\"><x:v>__DM_40_0__</x:v></x:c><x:c r=\"B41\" s=\"6\" t=\"str\"><x:v>__DM_40_1__</x:v></x:c></x:row><x:row r=\"42\" ht=\"30\" customHeight=\"1\"><x:c r=\"A42\" s=\"3\" t=\"str\"><x:v>__DM_41_0__</x:v></x:c><x:c r=\"B42\" s=\"3\" t=\"str\"><x:v>__DM_41_1__</x:v></x:c></x:row><x:row r=\"43\" ht=\"30\" customHeight=\"1\"><x:c r=\"A43\" s=\"3\" t=\"str\"><x:v>__DM_42_0__</x:v></x:c><x:c r=\"B43\" s=\"3\" t=\"str\"><x:v>__DM_42_1__</x:v></x:c></x:row></x:sheetData><x:pageMargins left=\"0.7\" right=\"0.7\" top=\"0.75\" bottom=\"0.75\" header=\"0.3\" footer=\"0.3\" /></x:worksheet>","_rels/.rels":"﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"/xl/workbook.xml\" Id=\"R2474d9e3aff9477a\" /></Relationships>","xl/drawings/_rels/drawing1.xml.rels":"﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"/xl/media/image.png\" Id=\"Rf9482ae74c8b4227\" /><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"/xl/media/image2.png\" Id=\"R513b9573ebcc4028\" /></Relationships>","xl/drawings/_rels/drawing2.xml.rels":"﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"/xl/media/image3.png\" Id=\"R36dc2698baf34294\" /><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/image\" Target=\"/xl/media/image4.png\" Id=\"Rd83fbe12769141f5\" /></Relationships>","xl/_rels/workbook.xml.rels":"﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"/xl/styles.xml\" Id=\"R075f4f7a5cba493c\" /><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme\" Target=\"/xl/theme/theme1.xml\" Id=\"R3b493d3b7d954ae8\" /><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings\" Target=\"/xl/sharedStrings.xml\" Id=\"R62a0e024da8d43d3\" /><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"/xl/worksheets/sheet1.xml\" Id=\"R3786510f0a4d439f\" /><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"/xl/worksheets/sheet2.xml\" Id=\"Race3e1b73750413f\" /><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"/xl/worksheets/sheet3.xml\" Id=\"R2cb0c6b7fafd4507\" /></Relationships>","xl/worksheets/_rels/sheet1.xml.rels":"﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing\" Target=\"/xl/drawings/drawing1.xml\" Id=\"R52d0233913904c67\" /></Relationships>","xl/worksheets/_rels/sheet2.xml.rels":"﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing\" Target=\"/xl/drawings/drawing2.xml\" Id=\"R6fec3c988a4e4e9d\" /></Relationships>","[Content_Types].xml":"﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\" /><Default Extension=\"png\" ContentType=\"image/png\" /><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\" /><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\" /><Override PartName=\"/xl/theme/theme1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.theme+xml\" /><Override PartName=\"/xl/sharedStrings.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml\" /><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\" /><Override PartName=\"/xl/drawings/drawing1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.drawing+xml\" /><Override PartName=\"/xl/worksheets/sheet2.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\" /><Override PartName=\"/xl/drawings/drawing2.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.drawing+xml\" /><Override PartName=\"/xl/worksheets/sheet3.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\" /></Types>"},"binary":{"xl/media/image.png":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=","xl/media/image2.png":"iVBORw0KGgoAAAANSUhEUgAACU4AAA0oCAYAAABKnZMfAAB9Q0lEQVR4nOzBAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgNmDAwEAAAAAIP/XRlBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVYQ8OBAAAAACA/F8bQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWlvft51bws4zj+nsF+2o+pRWgm1IQhmVKRUUFQIBbVRjklRKXB3UKkRWHQeqBFS6lAmLtFTbmpRIp+h0W1aBEFFkGCbdqk5BBhpKVOi/PAnIaZOs95nmfOGc7rBQ/n/t7n/t7X9Qd8+F4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHDhH9rsBAAAAAAAAAABY1hjjyuq51Z/nnM/udz9cei7b7wYAAAAAAAAAAGAZY4zLqj9Ux6orqkc3VOfh6sXVVXsJZ40xbqo+XL2jurJ6pvrj4jfnnL9cY7ssSXAKAAAAAAAAAIBLzXvbDk1tzBjjhuqa6kvLhqbGGMeqL1e3nuffb1v8bh9jnKo+Ned8fMV22YOj+90AAAAAAAAAAADs1hjj8urzF6HUBxd/v7nMS4uvYX2js6GpM9WDbfd8T/WLHcc/Wn19jHFktVbZC1+cAgAAAAAAAADgkjDGeFd1onr9RSi3VT3WfwedduPj1U2L9b+qW+ac39t5YDHC71TbYwbfU91VfXGlblmatBoAAAAAAAAAAAfWGOOT1c3Vm6tXnufIFXPOR9dc87rq99W9c847l3z3d9UbFo9bc85vXeDczdUP2s7vnK5eMed8Zu9dsyyj+gAAAAAAAAAAOMhurT7Q+UNTm7LXMX2v62xo6qELhaaq5pw/qn69eHx528EwLiKj+gAAAAAAAAAAOMjuq351zt5t1Ws2WHOr+mv1syXfu3bHejcj/n5b3bhYX8xgGAlOAQAAAAAAAABwgM05T567N8Z4YxsKTo0xrq2uq07uYXTeS6snF+s/7eL8C3asH1uyFisSnAIAAAAAAAAAgLP2NKavas55qjq1m7NjjOdU7148nqkeXrYeqzm63w0AAAAAAAAAAMABslWdrh7ccJ27q1ct1vfPOR/fcD3OITgFAAAAAAAAAADVGOOa6obqgTnn0xusc1f1ucXjU9WJTdXiwozqAwAAAAAAAACAbXse07cbY4zj1Req9y22nq0+Mud8aBP1+N8EpwAAAAAAAAAAYNtW9bfqJ+u8dIxxefXZ6jPV8xbbp6tPzDnvX2ctdk9wCgAAAAAAAACAQ2+M8drqTdVX5pz/XuO9t1T3VFfv2H6gunPO+Zd11WF5glMAAAAAAAAAALD9tala05i+McZLqpPVh3Zs/6a6e87503XUYDWCUwAAAAAAAAAAsB2c+nv141UvGmMcq35eXb/YOl19uvrqnPPMqvezHoJTAAAAAAAAAAAcamOMV1dvqb4253xqxbueX327s6GpH1Z3GMt38AhOAQAAAAAAAABw2K1zTN+J6p2L9X3V7XPOp9dwL2t2dL8bAAAAAAAAAACAfbZVPdH216H2bIzxwmosHh+phtDUwSU4BQAAAAAAAADAoTXGuLp6a/WdOeeTK153W/WyxfreOec/V7yPDTKqDwAAAAAAAACAw2yrOtJ6xvTduGP9sTHG+5d4d8w5H1lDD+yS4BQAAAAAAAAAAIfZVvWP6vtruOv4jvX1S777ojXUZwlG9QEAAAAAAAAAcCiNMa6q3l59d01j9Y7//yMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9x/ACKI2LUG8kZSAAAAAElFTkSuQmCC","xl/media/image3.png":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=","xl/media/image4.png":"iVBORw0KGgoAAAANSUhEUgAACU4AAA0oCAYAAABKnZMfAAB9HklEQVR4nOzBAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgNmDAwEAAAAAIP/XRlBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVYQ8OBAAAAACA/F8bQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWlvft7tT2f4zj+nHHkN4crjCkd0akxU4SiXKgpxdVooyYM9XGhkaJRbk25cDmhlI8LDm5wTIQwDeFSZO5MjWtN5iTRzDAzx8Wsmj2nOc5e67v2XmvX41Gr9fl++3w+79cf8O77BgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIBdu27XAQAAAAAAAAAA4FrGGLdWt1fvql5TPVn9ZfWbc87fH0PNB6uXVTfMOZ/a4PyJZ+boNE4BAAAAAAAAALC3xhhnq29WH7jG1gvVZ+ecj2yp7i3Vn6uvzTk/vebZs+0gM+u5ftcBAAAAAAAAAADguYwxzlTf75kGpMvV/dWXq3uq3x3a/tHqu2OMbX1I6IOr/x+sc2jHmVnDmV0HAAAAAAAAAACAq/hEdetq/Z/qtjnnzw5vWI3Du1C9unpvdWf11S3UPqge7tmNTkexy8yswRenAAAAAAAAAADYV585tL79ygakqjnnfdUdPf1lp6ovjjGet6ToGOOm6nx1cc755JrHd5KZ9WmcAgAAAAAAAABg74wx3lS9efX4wJzzh1fbO+f8ZfWH1eOrqrcuLL/pmL5dZmZNGqcAAAAAAAAAANhH5w+tjzIu70+H1q9dWPug+nv1mzXP7TIza9I4BQAAAAAAAADAPnpF9djq99cj7H/RofXDmxYdY5yvbqp+tMGYvp1kZjNndh0AAAAAAAAAAACuNOe8UF04yt4xxvOr96weL1cPLii90Zi+2mlmNuCLUwAAAAAAAAAAnHZ3Va9brS/OOR9ZcNdBdam6f3Gq/2+bmdmAxikAAAAAAAAAAE6tMcad1ZdWj49Xdy+4643VLdW9c84nthDvanW2lpnNGdUHAAAAAAAAAMCpM8Y4V32let/q1VPVR+acDyy4duMxfUdxTJnZkMYpAAAAAAAAAABOjTHGS6ovVJ+vXrB6fan65Jzz4sLrD6p/VPctvOdZjjkzG9I4BQAAAAAAAADAqTDGuK26p7rx0Ot7q0/NOf+28O43VG+pvjXn/O+Su66499gys4zGKQAAAAAAAAAA9toY4+XVN6oPHXr9x+quOeevt1TmYPW/lTF9J5SZBTROAQAAAAAAAACwt8YYZ6vfVjevXl2qPld9e855eYulDqp/Vr9aetEJZmYBjVMAAAAAAAAAAOylMcYLqx/3TAPSL6qPb3vE3Rjj9dXbqu/MOR9feNeJZGY5jVMAAAAAAAAAAOyru6t3r9bfq+6Ycz5xDHW2OabvpDKz0PW7DgAAAAAAAAAAAFcaY7y4GqvHh6pxjA1IB9W/evrrUBs74cwspHEKAAAAAAAAAIB99OHqlav11+ecjx5HkTHGjdU7qp/MOR9beN2JZGY7jOoDAAAAAAAAAGAfvf3Q+mNjjPevcXbMOR864t6D6rq2M6bvpDKzBRqnAAAAAAAAAADYR+cOrW9e8+xL19h7UP27+vmaNZ7LSWVmC4zqAwAAAAAAAABgH5279pZlxhg3VO+sfrqlsXrHnhkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg2P0PH7A5ZTWydOwAAAAASUVORK5CYII="}}; }

/**
 * 계약별 Excel 스냅샷. Utilities.zip만 사용하므로 추가 OAuth 권한이나 임시 시트가 필요 없습니다.
 * 가격 규칙 변경 시 run-contract-excel-tests.ts의 웹 가격 엔진 대조 테스트를 실행하세요.
 */
function getContractExcelRows(data, contractNumber) {
  const plus = data.productId === 'album_plus';
  const base = plus ? 1450000 : 1250000;
  const options = data.optionIds || [];
  const optionPrices = { second_shooter: 250000, pyebaek: 100000 };
  const optionNames = { second_shooter: '2인 촬영', pyebaek: '폐백 촬영' };
  const parts = (data.weddingDate || '').split('-').map(Number);
  const sunday = parts.length === 3 && new Date(parts[0], parts[1] - 1, parts[2]).getDay() === 0;
  const optionTotal = options.reduce(function(sum, id) { return sum + (optionPrices[id] || 0); }, 0);
  const discount = (sunday ? 100000 : 0) + (data.partnerDiscount ? 50000 : 0) + (data.portfolioConsent ? 100000 : 0);
  const adjustment = Number(data.manualAdjustment && data.manualAdjustment.amount) || 0;
  const total = Math.max(0, base + optionTotal - discount + adjustment);
  const yesNo = function(value) { return value ? '예' : '아니오'; };
  return [
    ['DEAR MEMORY 촬영 계약정보', '계약 발송 시점의 기록'],
    ['계약번호', contractNumber],
    ['예식일', data.weddingDate], ['예식시간', data.weddingTime],
    ['예식장', data.weddingVenue], ['홀', data.weddingHall],
    ['메이크업 장소 및 시간', data.makeupLocation],
    ['신랑 성명', data.groomName], ['신랑 연락처', data.groomPhone],
    ['신부 성명', data.brideName], ['신부 연락처', data.bridePhone],
    ['고객 이메일', data.email],
    ['신랑 직계가족', data.groomFamilyMembers], ['신부 직계가족', data.brideFamilyMembers],
    ['선택상품', plus ? '화보형' : '실속형'],
    ['추가옵션', options.map(function(id) { return optionNames[id] || id; }).join(', ') || '선택 없음'],
    ['일요일 예식 할인', yesNo(sunday)], ['짝꿍 할인', yesNo(data.partnerDiscount)],
    ['짝꿍 정보', data.partnerName], ['사진 공개 동의', yesNo(data.portfolioConsent)],
    ['촬영 요청사항', data.shootRequestNotes], ['후보정 요청사항', data.retouchRequestNotes],
    ['기타 요청사항 및 특약', data.requestNotes], ['유입경로', data.referralSource],
    ['인스타그램', data.instagramId], ['블로그', data.blogUrl],
    ['약관 동의', yesNo(data.termsAgreed)],
    ['금액 내역', '원'],
    ['상품금액', base], ['추가옵션 합계', optionTotal],
    ['일요일 예식 할인액', sunday ? -100000 : 0],
    ['짝꿍 할인액', data.partnerDiscount ? -50000 : 0],
    ['사진 공개 할인액', data.portfolioConsent ? -100000 : 0],
    ['대표 조정금액', adjustment], ['조정 사유', data.manualAdjustment && data.manualAdjustment.reason],
    ['최종 계약금액', total], ['계약금', 300000], ['잔금', Math.max(0, total - 300000)],
    ['계약 후기 페이백 (추후)', data.reviewContractCashback ? 50000 : 0],
    ['본식 후기 페이백 (추후)', data.reviewMainCashback ? 50000 : 0],
    ['추후 페이백 합계', (data.reviewContractCashback ? 50000 : 0) + (data.reviewMainCashback ? 50000 : 0)],
    ['페이백 안내', '후기 조건 충족 후 지급하며 현재 계약금액에서 차감하지 않습니다.'],
    ['금액 안내', '계약금과 잔금은 청구 예정액입니다. 실제 입금 확인 내역은 아닙니다.'],
  ];
}

function contractExcelXmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function createContractExcelBlob(data, contractNumber, pdfBlob) {
  return createContractExcelFromRows(getContractExcelRows(data, contractNumber), contractNumber + '_' + data.groomName + '_' + data.brideName + '_촬영계약서.xlsx', pdfBlob);
}

/** Primary sheets preserve PDF images. The final sheet keeps editable values. */
function createContractExcelFromRows(rows, fileName, pdfBlob) {
  const images = contractPdfPageImages(pdfBlob);
  const template = contractExcelTemplate();
  if (rows.length !== 43) throw new Error('계약정보 템플릿 행 수가 다릅니다.');
  let sheet = template.xml['xl/worksheets/sheet3.xml'];
  sheet = sheet.replace(/<x:c([^>]*?) t="str"><x:v>__DM_(\d+)_(\d+)__<\/x:v><\/x:c>/g, function(_, attrs, row, col) {
    const value = rows[Number(row)][Number(col)];
    if (typeof value === 'number' && Number.isFinite(value)) return '<x:c' + attrs + '><x:v>' + value + '</x:v></x:c>';
    return '<x:c' + attrs + ' t="inlineStr"><x:is><x:t xml:space="preserve">' + contractExcelXmlEscape(value) + '</x:t></x:is></x:c>';
  });
  sheet = sheet.replace(/<x:row r="(\d+)" ht="[^"]+"/g, function(_, row) {
    const value = String(rows[Number(row)-1][1] || '');
    const lines = value.split('\n').reduce(function(n, line) { return n + Math.max(1, Math.ceil(line.length / 45)); }, 0);
    return '<x:row r="' + row + '" ht="' + Math.max(30, Math.min(400, lines * 20)) + '"';
  });
  if (/__DM_/.test(sheet)) throw new Error('계약정보를 모두 채우지 못했습니다.');
  template.xml['xl/worksheets/sheet3.xml'] = sheet;
  images.forEach(function(image, i) {
    const path = 'xl/drawings/drawing' + (i+1) + '.xml';
    template.xml[path] = template.xml[path].replace(/<xdr:colOff>0<\/xdr:colOff>/, '<xdr:colOff>' + Math.max(0, Math.round(image.leftPx * 9525)) + '</xdr:colOff>')
      .replace(/<xdr:rowOff>0<\/xdr:rowOff>/, '<xdr:rowOff>' + Math.max(0, Math.round(image.topPx * 9525)) + '</xdr:rowOff>')
      .replace(/<xdr:ext cx="\d+" cy="\d+" \/>/, '<xdr:ext cx="' + Math.round(image.widthPx * 9525) + '" cy="' + Math.round(image.heightPx * 9525) + '" />');
  });
  const blobs = Object.keys(template.xml).map(function(path) { return Utilities.newBlob(template.xml[path], 'application/xml', path); });
  const imagePaths = ['xl/media/image.png', 'xl/media/image3.png'];
  Object.keys(template.binary).forEach(function(path) {
    const index = imagePaths.indexOf(path);
    const bytes = index < 0 ? Utilities.base64Decode(template.binary[path]) : Array.from(images[index].png, function(b) { return b > 127 ? b - 256 : b; });
    blobs.push(Utilities.newBlob(bytes, 'image/png', path));
  });
  return Utilities.zip(blobs, fileName).setContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/** Immediate calendar sync, 2026-11-17. Never scans old sent mail. */
function dmCalendarSpec_(data, contractNumber) {
  if (contractNumber === 'DM-20270516-XJWF' ||
      (data.groomName === '이송현' && data.brideName === '이수정' && data.weddingDate === '2027-05-16')) {
    throw new Error('사용자가 취소한 계약입니다. 자동 등록 제외.');
  }
  const day = String(data.weddingDate || '');
  const time = String(data.weddingTime || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
      !data.groomName || !data.brideName || !data.weddingVenue || !contractNumber) {
    throw new Error('계약서의 본식 날짜·시간·성함·예식장을 확인해 주세요.');
  }
  const utc = new Date(day + 'T00:00:00Z');
  if (utc.toISOString().slice(0, 10) !== day) throw new Error('유효하지 않은 본식 날짜');
  const identity = [day, time, data.groomName.trim(), data.brideName.trim()].join('|');
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, identity, Utilities.Charset.UTF_8)
    .map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
  return { day: day, time: time, key: 'DM_CAL_' + hash, marker: 'DM-CONTRACT:' + contractNumber,
    coupleMarker: 'DM-COUPLE:' + hash,
    title: data.weddingVenue.trim() + '/' + time + '/' + data.brideName.trim() };
}

function dmSyncCalendar_(data, contractNumber, folderUrl) {
  const spec = dmCalendarSpec_(data, contractNumber);
  if (!folderUrl) throw new Error('Drive 저장을 확인할 수 없어 캘린더를 등록하지 않았습니다.');
  const match = folderUrl.match(/\/folders\/([\w-]+)/);
  if (!match) throw new Error('Drive 폴더 주소 확인 필요');
  const folder = DriveApp.getFolderById(match[1]);
  if (folder.isTrashed()) throw new Error('삭제된 계약 폴더입니다.');
  const files = folder.getFiles();
  let source = '';
  while (files.hasNext()) {
    const file = files.next();
    if (!file.isTrashed() && file.getName().indexOf(contractNumber + '_') === 0 &&
        /\.(pdf|jpe?g)$/i.test(file.getName())) { source = file.getUrl(); break; }
  }
  if (!source) throw new Error('Drive에 PDF/JPG 원본이 없어 자동 등록하지 않았습니다.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    const calendar = CalendarApp.getCalendarById('mgsecret87@gmail.com');
    if (!calendar) throw new Error('대상 캘린더 접근 실패');
    const prior = props.getProperty(spec.key);
    if (prior) {
      const event = calendar.getEventById(prior);
      if (!event) throw new Error('이전에 등록된 일정이 삭제되었습니다. 자동 복원하지 않습니다.');
      dmVerifyCalendar_(event, spec);
      return { saved: true, eventId: prior, existing: true };
    }
    const start = new Date(spec.day + 'T00:00:00+09:00');
    const end = new Date(start.getTime() + 86400000);
    const events = calendar.getEvents(start, end);
    for (let i = 0; i < events.length; i++) {
      const lines = (events[i].getDescription() || '').split(/\r?\n/);
      if (lines.indexOf(spec.marker) >= 0 || lines.indexOf(spec.coupleMarker) >= 0) {
        dmVerifyCalendar_(events[i], spec);
        props.setProperty(spec.key, events[i].getId());
        return { saved: true, eventId: events[i].getId(), existing: true };
      }
    }
    // CalendarApp all-day date is interpreted in the script timezone.
    const date = Utilities.parseDate(spec.day, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const event = calendar.createAllDayEvent(spec.title, date, {
      location: [data.weddingVenue, data.weddingHall || ''].join(' ').trim(),
      description: [spec.marker, spec.coupleMarker, '신랑: ' + data.groomName,
        '신부: ' + data.brideName, '본식 일시: ' + spec.day + ' ' + spec.time,
        '계약서: ' + source].join('\n'),
      sendInvites: false
    });
    // Record immediately; retry after a reminder/verification error must not duplicate.
    props.setProperty(spec.key, event.getId());
    event.removeAllReminders();
    const check = calendar.getEventById(event.getId());
    if (!check || !check.isAllDayEvent() || check.getTitle() !== spec.title ||
        Utilities.formatDate(check.getAllDayStartDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd') !== spec.day ||
        check.getEmailReminders().length || check.getPopupReminders().length) {
      throw new Error('캘린더 저장 후 날짜 또는 알림 검증 실패');
    }
    return { saved: true, eventId: check.getId(), existing: false };
  } finally { lock.releaseLock(); }
}

function dmAfterContractSent_(data, contractNumber, folderUrl, excelStorage) {
  let result;
  try { result = dmSyncCalendar_(data, contractNumber, folderUrl); }
  catch (err) { result = { saved: false, error: String(err) }; }
  if (!result.saved || !excelStorage.saved) {
    try {
      GmailApp.sendEmail('mgsecret87@gmail.com',
        '[디어메모리 확인 필요] ' + data.brideName + ' / ' + contractNumber,
        ['고객 메일은 발송되었습니다. 고객에게 재발송하지 마세요.',
          '계약번호: ' + contractNumber, '신부: ' + data.brideName,
          'Drive 폴더: ' + (folderUrl || '확인 실패'),
          'Excel: ' + (excelStorage.saved ? '저장됨' : '확인 필요'),
          '캘린더: ' + (result.saved ? '등록 확인' : result.error)].join('\n'));
    } catch (alertErr) {
      result.alertError = String(alertErr);
      Logger.log('계약 후속 확인 알림 실패: ' + alertErr);
    }
  }
  return result;
}

/** Read-only authorization/access check. Does not send mail or create events. */
function dmCalendarPreflight() {
  const cal = CalendarApp.getCalendarById('mgsecret87@gmail.com');
  if (!cal) throw new Error('캘린더 접근 실패');
  Logger.log('CALENDAR_READY: ' + cal.getId());
}

function dmVerifyCalendar_(event, spec) {
  if (!event || !event.isAllDayEvent() ||
      Utilities.formatDate(event.getAllDayStartDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd') !== spec.day ||
      event.getTitle() !== spec.title || event.getEmailReminders().length || event.getPopupReminders().length) {
    throw new Error('기존 일정의 날짜·제목·알림을 확인해 주세요. 임의 변경하지 않았습니다.');
  }
}

// Admin-only signed revision action; original submit/approve paths are unchanged.
function dmReviseContract_(request) {
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('DM_REFERRAL_SECRET');
  if (!secret || secret.length < 32 || !request || typeof request.body !== 'string' ||
      request.body.length > 5500000 || !/^[a-f0-9]{64}$/.test(request.signature || '')) throw new Error('수정 요청 인증 실패');
  const expected = Utilities.computeHmacSha256Signature(request.body, secret, Utilities.Charset.UTF_8)
    .map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
  let mismatch=0;
  for(let i=0;i<expected.length;i++) mismatch |= expected.charCodeAt(i)^request.signature.charCodeAt(i);
  if(mismatch) throw new Error('수정 요청 인증 실패');
  const p=JSON.parse(request.body);
  if(!Number.isSafeInteger(p.timestamp)||Math.abs(Date.now()-p.timestamp)>120000) throw new Error('수정 요청 만료');
  if(p.operation==='probe') return createJsonResponse({success:true,revisionReady:true});
  if(p.operation!=='send'||!/^[a-zA-Z0-9_-]{1,100}$/.test(p.contractId||'')||!/^[0-9a-f-]{36}$/.test(p.revisionId||'')||
      !Number.isSafeInteger(p.revision)||p.revision<1||!/^DM-[A-Za-z0-9-]+$/.test(p.contractNumber||'')) throw new Error('수정 요청 형식 확인 필요');
  const d=p.data;
  if(!d||!d.email||!d.groomName||!d.brideName||!d.weddingDate) throw new Error('계약 정보 확인 필요');
  const match=String(p.folderUrl||'').match(/^https:\/\/drive\.google\.com\/.*\/folders\/([\w-]+)|^https:\/\/drive\.google\.com\/drive\/folders\/([\w-]+)/);
  const folderId=match&&(match[1]||match[2]);
  if(!folderId) throw new Error('기존 계약 폴더 확인 필요');
  const folder=DriveApp.getFolderById(folderId);
  if(folder.isTrashed()) throw new Error('원본 계약 폴더가 삭제되었습니다.');
  const files=folder.getFiles(); let original=false;
  while(files.hasNext()){const file=files.next();if(!file.isTrashed()&&file.getName().indexOf(p.contractNumber+'_')===0&&/\.pdf$/i.test(file.getName())){original=true;break;}}
  if(!original) throw new Error('원본 PDF 확인 필요');
  function decode(value,mime,name){
    if(typeof value!=='string'||!value) throw new Error('첨부파일 누락');
    const bytes=Utilities.base64Decode(value.substring(value.indexOf(',')+1).replace(/\s/g,''));
    if(!bytes.length) throw new Error('첨부파일 누락');
    if(mime==='application/pdf'&&(bytes[0]!==37||bytes[1]!==80||bytes[2]!==68||bytes[3]!==70)) throw new Error('PDF 형식 오류');
    if(mime==='image/jpeg'&&((bytes[0]+256)%256!==255||(bytes[1]+256)%256!==216)) throw new Error('JPG 형식 오류');
    return Utilities.newBlob(bytes,mime,name);
  }
  const name='수정'+p.revision+'차_'+p.contractNumber+'_촬영계약서';
  const pdf=decode(p.pdfBase64,'application/pdf',name+'.pdf');
  const jpg=decode(p.jpgBase64,'image/jpeg',name+'.jpg');
  const rows=getContractExcelRows(d,p.contractNumber);
  const total=rows.find(function(row){return row[0]==='최종 계약금액';})[1];
  if(!Number.isSafeInteger(p.deposit)||p.deposit<0||p.deposit>total||!Number.isSafeInteger(p.paid)||p.paid<0||!Number.isSafeInteger(p.balance)||p.balance<0) throw new Error('수정 정산 정보 확인 필요');
  rows.find(function(row){return row[0]==='계약금';})[1]=p.deposit;
  rows.find(function(row){return row[0]==='잔금';})[1]=Math.max(0,total-p.deposit);
  // Keep the existing editable workbook layout and add a version-specific filename.
  const excel=createContractExcelFromRows(rows,name+'.xlsx',pdf);
  const key='DM_REV_'+p.revisionId;
  const lock=LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const prior=props.getProperty(key);
    if(prior){const state=JSON.parse(prior);if(state.result)return createJsonResponse(state.result);throw new Error('이전 발송 결과 확인 필요');}
    props.setProperty(key,JSON.stringify({started:true}));
  } finally {lock.releaseLock();}
  // Originals are never replaced, and the existing calendar import ignores non-DM filenames.
  const revised=folder.createFolder('수정계약서_'+p.revision+'차_'+p.revisionId.slice(0,8));
  revised.createFile(pdf); revised.createFile(jpg); const excelFile=revised.createFile(excel);
  const subject='[DEAR MEMORY] 수정 본식스냅 촬영 계약서 ('+d.groomName+' · '+d.brideName+' 고객님)';
  const message=['안녕하세요, 디어메모리입니다.','협의된 변경 사항을 반영한 '+p.revision+'차 수정 계약서를 첨부드립니다.','계약번호: '+p.contractNumber,'기존 계약금 및 입금 내역은 유지됩니다. 이미 입금하신 계약금을 다시 입금하실 필요는 없습니다.','확인된 입금액: '+p.paid.toLocaleString('ko-KR')+'원 / 변경 후 정산 잔금: '+p.balance.toLocaleString('ko-KR')+'원','변경된 계약서 내용을 확인 부탁드립니다. 감사합니다.'].join('\n\n');
  GmailApp.sendEmail(d.email,subject,message,{name:'DEAR MEMORY',attachments:[pdf]});
  let repSent=false;
  try {GmailApp.sendEmail(REP_EMAIL,subject,message,{name:'DEAR MEMORY',attachments:[pdf]});repSent=true;} catch(err){Logger.log('수정 대표 메일 확인 필요');}
  const result={success:true,customerEmailSent:true,representativeEmailSent:repSent,contractNumber:p.contractNumber,driveSaved:true,excelSaved:true,revisionFolderUrl:revised.getUrl(),excelFileUrl:excelFile.getUrl()};
  props.setProperty(key,JSON.stringify({result:result}));
  return createJsonResponse(result);
}