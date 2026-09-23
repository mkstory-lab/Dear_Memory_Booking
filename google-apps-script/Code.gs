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
  
  // HTML 이메일 본문 생성
  const subject = `[DEAR MEMORY] 신규 계약정보 | ${formData.groomName} · ${formData.brideName} | ${formData.weddingDate}`;
  const htmlBody = `
    <div style="font-family: sans-serif; padding: 20px; color: #322A1B; background: #FAF8F5;">
      <h2>[DEAR MEMORY] 신규 본식스냅 계약정보 접수</h2>
      <p><strong>고객:</strong> ${formData.groomName} ♥ ${formData.brideName}</p>
      <p><strong>예식일시:</strong> ${formData.weddingDate} ${formData.weddingTime}</p>
      <p><strong>웨딩홀:</strong> ${formData.weddingVenue} ${formData.weddingHall}</p>
      <p><strong>연락처:</strong> 신랑(${formData.groomPhone}), 신부(${formData.bridePhone})</p>
      <p><strong>이메일:</strong> ${formData.email}</p>
      <br/>
      <p>대표 확인 링크를 통해 계약서를 확인 및 발송해 주세요.</p>
    </div>
  `;

  GmailApp.sendEmail(REP_EMAIL, subject, "", {
    htmlBody: htmlBody,
    name: "DEAR MEMORY CONTRACT",
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
  if (pdfBase64) {
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const decodedBytes = Utilities.base64Decode(base64Data);
    pdfBlob = Utilities.newBlob(decodedBytes, "application/pdf", `${contractNumber}_계약서.pdf`);
  }

  // 고객 메일 발송 (PDF 첨부)
  const customerHtml = `
    <div style="font-family: sans-serif; padding: 20px; color: #322A1B;">
      <h2>DEAR MEMORY</h2>
      <p>안녕하세요, ${data.groomName} ♥ ${data.brideName} 고객님.</p>
      <p>두 분의 소중한 본식스냅 촬영 계약서를 첨부하여 전달드립니다.</p>
      <p>첨부된 계약서 PDF 파일을 확인해 주시기 바랍니다.</p>
      <br/>
      <p>감사합니다.<br/>DEAR MEMORY 한민규 대표 배상</p>
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
    eventFolder.createFile(pdfBlob);
  }

  // JPG 저장
  if (jpgBase64) {
    const jpgClean = jpgBase64.replace(/^data:image\/jpeg;base64,/, "");
    const jpgBytes = Utilities.base64Decode(jpgClean);
    const jpgBlob = Utilities.newBlob(jpgBytes, "image/jpeg", `${contractNumber}_계약서.jpg`);
    eventFolder.createFile(jpgBlob);
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
