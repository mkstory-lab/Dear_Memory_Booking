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

    if (action === "submit_contract") {
      return handleSubmitContract(payload);
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

  GmailApp.sendEmail(REP_EMAIL, subject, "", {
    htmlBody: htmlBody,
    name: "DEAR MEMORY",
  });

  return createJsonResponse({
    success: true,
    message: "대표 메일로 알림이 발송되었습니다.",
  });
}

/**
 * 2. 대표 최종 승인 시 고객/대표 메일 발송 및 Google Drive 백업
 */
function handleApproveAndSend(payload) {
  const { updatedData, pdfBase64, jpgBase64, contractNumber } = payload;
  const data = updatedData;

  const subject = `[DEAR MEMORY] 본식스냅 촬영 계약서 안내 (${data.groomName} · ${data.brideName} 고객님)`;
  
  // PDF Blob 변환
  let pdfBlob = null;
  if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.trim().length > 0) {
    try {
      const commaIdx = pdfBase64.indexOf(",");
      const base64Data = commaIdx !== -1 ? pdfBase64.substring(commaIdx + 1) : pdfBase64;
      const cleanBase64 = base64Data.replace(/[\r\n\s]/g, "");
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      pdfBlob = Utilities.newBlob(decodedBytes, "application/pdf", `${contractNumber}_촬영계약서.pdf`);
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

  // 대표 메일에도 발송완료 통지 및 동일 PDF 첨부
  const repSubject = `[DEAR MEMORY 계약서 발송완료] ${data.groomName} · ${data.brideName} | ${data.weddingDate}`;
  GmailApp.sendEmail(REP_EMAIL, repSubject, `계약번호: ${contractNumber}\n고객(${data.email})에게 계약서가 발송되었습니다.`, {
    attachments: pdfBlob ? [pdfBlob] : [],
    name: "DEAR MEMORY CONTRACT",
  });

  // 3. Optional Google Drive 자동 저장
  let driveFolderUrl = "";
  try {
    driveFolderUrl = saveContractToGoogleDrive(data, contractNumber, pdfBlob, jpgBase64);
  } catch (driveErr) {
    Logger.log("Drive 저장 오류: " + driveErr.toString());
  }

  return createJsonResponse({
    success: true,
    contractNumber: contractNumber,
    customerEmailSent: true,
    representativeEmailSent: true,
    driveSaved: !!driveFolderUrl,
    driveFolderUrl: driveFolderUrl,
    message: "계약서 발송 및 드라이브 저장이 완료되었습니다.",
  });
}

/**
 * Google Drive에 폴더 계층 생성 및 파일 저장
 */
function saveContractToGoogleDrive(data, contractNumber, pdfBlob, jpgBase64) {
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
      const jpgBlob = Utilities.newBlob(jpgBytes, "image/jpeg", `${contractNumber}_계약서.jpg`);
      eventFolder.createFile(jpgBlob);
    } catch (jpgErr) {
      Logger.log("JPG Drive 저장 실패: " + jpgErr.toString());
    }
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
