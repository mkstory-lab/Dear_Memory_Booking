/**
 * Dear Memory Contract — Google Apps Script Web App
 * 
 * 기능:
 * 1. doPost(e): Web App 엔드포인트
 * 2. action: 'submit_contract' -> 대표 Gmail 알림 발송
 * 3. action: 'approve_and_send' -> 고객 메일 발송(PDF 첨부), 대표 메일 발송(PDF 첨부), Google Drive 자동 저장
 */

// 대표 Gmail 주소
const REP_EMAIL = "contact@dearmemory.kr";

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload;

    if (action === "submit_contract") {
      return handleSubmitContract(payload);
    } else if (action === "approve_and_send") {
      return handleApproveAndSend(payload);
    } else {
      return createJsonResponse({ success: false, error: "알 수 없는 요청 액션입니다." });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 1. 고객 제출 시 대표 알림 메일 발송
 */
function handleSubmitContract(payload) {
  const formData = payload.formData;
  const reviewUrl = payload.reviewUrl || "";
  
  const subject = `[DEAR MEMORY] 신규 계약 접수 | ${formData.groomName} · ${formData.brideName} 고객님 (${formData.weddingDate})`;
  const optionNames = [];
  if (formData.optionIds && Array.isArray(formData.optionIds)) {
    if (formData.optionIds.indexOf('sub_photographer') !== -1) optionNames.push('2인 촬영 (+250,000원)');
    if (formData.optionIds.indexOf('pyebaek') !== -1) optionNames.push('폐백 촬영 (+100,000원)');
  }
  const optionsText = optionNames.length > 0 ? optionNames.join(', ') : '선택 없음';

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
        <p style="margin: 0;"><strong>신랑·신부:</strong> ${formData.groomName} ♥ ${formData.brideName}</p>
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

  // 고객 메일 발송 (PDF 첨부)
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
        ${data.optionIds && data.optionIds.length > 0 ? `<p style="margin: 0;"><strong>추가옵션:</strong> ${data.optionIds.map(function(o){ return o === 'sub_photographer' ? '2인 촬영(+25만)' : o === 'pyebaek' ? '폐백 촬영(+10만)' : o; }).join(', ')}</p>` : ''}
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

      <div style="text-align: center; border-top: 1px solid #EBE3D5; pt: 16px; margin-top: 20px; font-size: 11px; color: #8F7A56;">
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
 * Dear Memory / Contracts / YYYY / YYYY-MM-DD_신랑_신부 / contract.pdf
 */
function saveContractToGoogleDrive(data, contractNumber, pdfBlob, jpgBase64) {
  const rootFolderName = "Dear Memory";
  const contractsFolderName = "Contracts";
  const yearStr = data.weddingDate.substring(0, 4);
  const targetFolderName = `${data.weddingDate}_${data.groomName}_${data.brideName}`;

  // 루트 폴더 조회 또는 생성
  let rootFolder = getOrCreateSubFolder(DriveApp.getRootFolder(), rootFolderName);
  let contractsFolder = getOrCreateSubFolder(rootFolder, contractsFolderName);
  let yearFolder = getOrCreateSubFolder(contractsFolder, yearStr);
  let eventFolder = getOrCreateSubFolder(yearFolder, targetFolderName);

  // PDF 저장
  if (pdfBlob) {
    try {
      eventFolder.createFile(pdfBlob);
    } catch (e) {
      Logger.log("PDF Drive 저장 오류: " + e.toString());
    }
  }

  // JPG 저장
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

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
