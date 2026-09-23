import { ContractFormData, PriceCalculationResult } from '@/types/contract';
import { getProductById } from '@/config/products';
import { getOptionById } from '@/config/options';
import { formatKRW } from './pricing';

/**
 * 1. 신규 계약정보 접수 시 대표에게 발송되는 알림 이메일 HTML
 */
export function generateRepresentativeNotificationEmail(
  data: ContractFormData,
  pricing: PriceCalculationResult,
  reviewUrl: string
): { subject: string; html: string } {
  const weddingDateFormatted = data.weddingDate.replace(/-/g, '.');
  const subject = `[DEAR MEMORY] 신규 계약정보 | ${data.groomName} · ${data.brideName} | ${weddingDateFormatted}`;

  const product = getProductById(data.productId);
  const selectedOptionObjects = data.optionIds.map((id) => getOptionById(id)).filter(Boolean);
  const selectedOptions = selectedOptionObjects.map((opt) => opt!.name);

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; color: #322A1B; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #EBE3D5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    
    <!-- 헤더 -->
    <div style="background-color: #322A1B; padding: 28px 24px; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 3px; color: #C7B698; font-weight: 600;">WEDDING PHOTOGRAPHY</p>
      <h1 style="margin: 0; font-size: 20px; color: #FFFFFF; font-weight: 500; letter-spacing: 1px;">DEAR MEMORY</h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #EBE3D5;">신규 본식스냅 계약정보가 접수되었습니다.</p>
    </div>

    <!-- 내용 -->
    <div style="padding: 28px 24px;">
      
      <!-- 신랑신부 & 예식 -->
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #F5F1EA;">
        <span style="display: inline-block; padding: 4px 12px; background: #F5F1EA; color: #8F7A56; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 10px;">신규 접수</span>
        <h2 style="margin: 0 0 6px 0; font-size: 20px; color: #322A1B; font-weight: 600;">
          ${data.groomName} ♥ ${data.brideName}
        </h2>
        <p style="margin: 0; font-size: 15px; color: #6E5C3D; font-weight: 500;">
          ${weddingDateFormatted} ${data.weddingTime}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #8F7A56;">
          ${data.weddingVenue} ${data.weddingHall}
        </p>
      </div>

      <!-- 고객 연락처 & 이메일 -->
      <div style="background: #FAF8F5; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px;">
        <div style="margin-bottom: 6px;">
          <span style="color: #8F7A56; width: 85px; display: inline-block;">신랑 연락처:</span>
          <span style="font-weight: 500;">${data.groomPhone}</span>
        </div>
        <div style="margin-bottom: 6px;">
          <span style="color: #8F7A56; width: 85px; display: inline-block;">신부 연락처:</span>
          <span style="font-weight: 500;">${data.bridePhone}</span>
        </div>
        <div>
          <span style="color: #8F7A56; width: 85px; display: inline-block;">수신 이메일:</span>
          <span style="font-weight: 500; color: #322A1B;">${data.email}</span>
        </div>
      </div>

      <!-- 선택 상품 및 옵션 -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; letter-spacing: 0.5px; color: #8F7A56; text-transform: uppercase;">선택 상품 및 옵션</h3>
        <div style="border: 1px solid #EBE3D5; border-radius: 8px; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 600; color: #322A1B;">${product?.name}</span>
            <span style="font-weight: 500;">${formatKRW(pricing.basePrice)}</span>
          </div>
          ${selectedOptionObjects.length > 0 ? selectedOptionObjects.map((opt) => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #6E5C3D; margin-top: 4px;">
              <span>+ ${opt!.name}</span>
              <span style="font-weight: 500;">+${formatKRW(opt!.price)}</span>
            </div>
          `).join('') : '<div style="font-size: 12px; color: #8F7A56;">추가 옵션 없음</div>'}
        </div>
      </div>

      <!-- 금액 정산 요약 -->
      <div style="background: #FAF8F5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #6E5C3D;">기본 상품 (${product?.name})</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${formatKRW(pricing.basePrice)}</td>
          </tr>
          ${pricing.optionTotal > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #6E5C3D;">추가 옵션 합계</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">+${formatKRW(pricing.optionTotal)}</td>
          </tr>` : ''}
          ${pricing.immediateDiscountTotal > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #B09A74;">
              즉시 할인 혜택
              ${pricing.isSunday ? '<br><span style="font-size: 11px;">• 일요일 예식 (-100,000원)</span>' : ''}
              ${data.partnerDiscount ? `<br><span style="font-size: 11px;">• 짝꿍 추천 (${data.partnerName}) (-50,000원)</span>` : ''}
              ${data.portfolioConsent ? '<br><span style="font-size: 11px;">• 사진 공개 감사 (-100,000원)</span>' : ''}
            </td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #B09A74; vertical-align: top;">-${formatKRW(pricing.immediateDiscountTotal)}</td>
          </tr>` : ''}
          ${pricing.manualAdjustmentAmount !== 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #6E5C3D;">수동 조정</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${pricing.manualAdjustmentAmount > 0 ? '+' : ''}${formatKRW(pricing.manualAdjustmentAmount)}</td>
          </tr>` : ''}
          <tr style="border-top: 1px solid #DDD1BD;">
            <td style="padding: 10px 0 0 0; font-size: 15px; font-weight: 600; color: #322A1B;">최종 계약금액</td>
            <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #322A1B;">${formatKRW(pricing.contractTotal)}</td>
          </tr>
        </table>

        ${pricing.futureCashbackTotal > 0 ? `
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #DDD1BD; font-size: 12px; color: #8F7A56; display: flex; justify-content: space-between;">
          <span>추후 후기 작성 시 페이백 가능</span>
          <span style="font-weight: 600; color: #6E5C3D;">최대 ${formatKRW(pricing.futureCashbackTotal)}</span>
        </div>` : ''}
      </div>

      <!-- 요청사항 (있는 경우) -->
      ${data.requestNotes ? `
      <div style="margin-bottom: 24px; padding: 12px 14px; background: #FFF; border-left: 3px solid #B09A74; font-size: 13px;">
        <strong style="color: #6E5C3D; display: block; margin-bottom: 4px;">고객 요청사항:</strong>
        <p style="margin: 0; color: #322A1B; white-space: pre-wrap;">${data.requestNotes}</p>
      </div>` : ''}

      <!-- CTA 버튼 -->
      <div style="text-align: center; margin: 30px 0 10px 0;">
        <a href="${reviewUrl}" style="display: block; width: 100%; box-sizing: border-box; background-color: #322A1B; color: #FAF8F5; text-decoration: none; padding: 16px 20px; font-size: 15px; font-weight: 600; border-radius: 8px; letter-spacing: 0.5px;">
          계약서 확인 및 발송하기 &rarr;
        </a>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #8F7A56;">
          * 보안 승인 링크를 통해 내용을 최종 확인 또는 수정한 후 원클릭 발송할 수 있습니다.
        </p>
      </div>

    </div>

    <!-- 푸터 -->
    <div style="background-color: #FAF8F5; padding: 16px 24px; text-align: center; border-top: 1px solid #EBE3D5; font-size: 11px; color: #8F7A56;">
      <p style="margin: 0;">DEAR MEMORY FOR BOOKING</p>
    </div>

  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}

/**
 * 2. 최종 계약서 발송 시 고객에게 전달되는 이메일 HTML
 */
export function generateCustomerContractEmail(
  data: ContractFormData,
  pricing: PriceCalculationResult,
  contractNumber: string
): { subject: string; html: string } {
  const weddingDateFormatted = data.weddingDate.replace(/-/g, '.');
  const subject = `[DEAR MEMORY] 본식스냅 촬영 계약서 안내 (${data.groomName} · ${data.brideName} 고객님)`;

  const product = getProductById(data.productId);

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; color: #322A1B; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #EBE3D5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    
    <!-- 헤더 -->
    <div style="background-color: #322A1B; padding: 32px 24px; text-align: center;">
      <p style="margin: 0 0 6px 0; font-size: 11px; letter-spacing: 3px; color: #C7B698; font-weight: 600;">WEDDING PHOTOGRAPHY</p>
      <h1 style="margin: 0; font-size: 22px; color: #FFFFFF; font-weight: 500; letter-spacing: 1px;">DEAR MEMORY</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #EBE3D5;">본식스냅 촬영 계약서 안내</p>
    </div>

    <!-- 본문 카드 -->
    <div style="padding: 28px 24px;">
      
      <p style="font-size: 16px; margin: 0 0 16px 0; color: #322A1B; font-weight: 500;">
        안녕하세요, <strong>${data.groomName} ♥ ${data.brideName}</strong> 고객님.
      </p>
      <p style="font-size: 14px; color: #6E5C3D; margin: 0 0 24px 0; line-height: 1.7;">
        두 분의 소중하고 가장 아름다운 시작을 디어메모리와 함께해 주셔서 진심으로 감사드립니다.<br>
        신청해 주신 본식스냅 촬영 계약서를 첨부 파일(PDF)로 정성껏 발행하여 전달드립니다.
      </p>

      <!-- 계약 요약 카드 -->
      <div style="background: #FAF8F5; border-radius: 10px; border: 1px solid #EBE3D5; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #8F7A56; width: 90px;">계약 번호</td>
            <td style="padding: 6px 0; font-weight: 600; color: #322A1B;">${contractNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8F7A56;">예식 일시</td>
            <td style="padding: 6px 0; font-weight: 500; color: #322A1B;">${weddingDateFormatted} ${data.weddingTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8F7A56;">웨딩홀</td>
            <td style="padding: 6px 0; font-weight: 500; color: #322A1B;">${data.weddingVenue} ${data.weddingHall}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8F7A56;">선택 상품</td>
            <td style="padding: 6px 0; font-weight: 500; color: #322A1B;">${product?.name}</td>
          </tr>
          <tr style="border-top: 1px solid #DDD1BD;">
            <td style="padding: 12px 0 0 0; color: #322A1B; font-weight: 600;">최종 계약금액</td>
            <td style="padding: 12px 0 0 0; font-size: 17px; font-weight: 700; color: #322A1B;">${formatKRW(pricing.contractTotal)}</td>
          </tr>
        </table>
      </div>

      <!-- 입금 안내 -->
      <div style="background: #FFF; border: 1px solid #EBE3D5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #8F7A56; font-weight: 600;">계약금 안내</h4>
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #322A1B;">
          &bull; <strong>계약금: 300,000원</strong> (계약 신청 후 24시간 이내 입금 원칙)
        </p>
        <p style="margin: 0; font-size: 13px; color: #6E5C3D;">
          &bull; 잔금: ${formatKRW(pricing.balanceAmount)} (예식 1주일 전까지 입금)
        </p>
      </div>

      <div style="padding: 14px 16px; background-color: #F5F1EA; border-radius: 8px; font-size: 12px; color: #6E5C3D; line-height: 1.6;">
        <p style="margin: 0;">
          <strong>안내사항</strong><br>
          첨부된 공식 PDF 계약서에 촬영 세부 구성, 원본/보정본 제공 일정, 계약 약관이 상세히 기재되어 있습니다. 소중히 보관해 주시기 바랍니다.
        </p>
      </div>

    </div>

    <!-- 푸터 -->
    <div style="background-color: #FAF8F5; padding: 20px 24px; text-align: center; border-top: 1px solid #EBE3D5; font-size: 12px; color: #8F7A56;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #6E5C3D;">DEAR MEMORY</p>
      <p style="margin: 0;">문의: 010-4822-2615 | 카카오톡 채널 '디어메모리'</p>
    </div>

  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}

/**
 * 3. 최종 계약서 발송 완료 시 대표에게 전달되는 확인 이메일 HTML
 */
export function generateRepresentativeSentConfirmationEmail(
  data: ContractFormData,
  pricing: PriceCalculationResult,
  contractNumber: string
): { subject: string; html: string } {
  const weddingDateFormatted = data.weddingDate.replace(/-/g, '.');
  const subject = `[DEAR MEMORY 계약서 발송완료] ${data.groomName} · ${data.brideName} | ${weddingDateFormatted}`;

  const product = getProductById(data.productId);

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; color: #322A1B; line-height: 1.5;">
  <div style="max-width: 500px; margin: 0 auto; border: 1px solid #DDD1BD; border-radius: 8px; padding: 20px; background: #FFFFFF;">
    <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #322A1B;">[발송완료] ${data.groomName} · ${data.brideName}</h2>
    <p style="font-size: 13px; color: #6E5C3D; margin: 0 0 16px 0;">
      고객(${data.email})에게 최종 계약서 PDF 발송이 정상 완료되었습니다.
    </p>
    <ul style="font-size: 13px; color: #322A1B; padding-left: 20px; margin: 0 0 16px 0;">
      <li>계약번호: <strong>${contractNumber}</strong></li>
      <li>예식일시: ${weddingDateFormatted} ${data.weddingTime}</li>
      <li>웨딩홀: ${data.weddingVenue} ${data.weddingHall}</li>
      <li>상품: ${product?.name}</li>
      <li>계약금액: <strong>${formatKRW(pricing.contractTotal)}</strong></li>
      <li>신랑: ${data.groomName} (${data.groomPhone})</li>
      <li>신부: ${data.brideName} (${data.bridePhone})</li>
    </ul>
    <p style="font-size: 12px; color: #8F7A56; margin: 0;">
      첨부된 동일 PDF 계약서를 보관용으로 확인하실 수 있습니다.
    </p>
  </div>
</body>
</html>
  `.trim();

  return { subject, html };
}
