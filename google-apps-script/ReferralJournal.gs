/** Isolated referral journal. Not wired to doPost until deployment configuration is reviewed.
 * Required script properties: DM_REFERRAL_SECRET, DM_REFERRAL_SHEET_ID.
 * One committed transaction per row. Never discover/create/migrate an existing customer sheet.
 */
function dmReferralJournal_(request) {
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty('DM_REFERRAL_SECRET');
  const sheetId = properties.getProperty('DM_REFERRAL_SHEET_ID');
  if (!secret || secret.length < 32 || !sheetId) throw new Error('추천 관리 저장소 설정이 필요합니다.');
  if (!request || typeof request.body !== 'string' || request.body.length > 45000 ||
      typeof request.signature !== 'string' || !/^[a-f0-9]{64}$/.test(request.signature)) throw new Error('인증 실패');
  const expected = Utilities.computeHmacSha256Signature(request.body, secret, Utilities.Charset.UTF_8)
    .map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ request.signature.charCodeAt(i);
  if (mismatch) throw new Error('인증 실패');
  const body = JSON.parse(request.body);
  if (!Number.isSafeInteger(body.timestamp) || Math.abs(Date.now() - body.timestamp) > 60000) throw new Error('요청 만료');
  if (!['read', 'append'].includes(body.operation)) throw new Error('지원하지 않는 저장 요청');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('ReferralJournal');
    if (!sheet) throw new Error('추천 이력 시트가 없습니다.');
    const rows = sheet.getDataRange().getValues();
    if (rows[0][0] !== 'transaction_id' || rows[0][1] !== 'events_json') throw new Error('추천 이력 시트 형식 오류');
    const version = rows.length - 1;
    if (body.operation === 'read') {
      return { version: version, events: rows.slice(1).reduce(function(all, row) { return all.concat(JSON.parse(row[1])); }, []) };
    }
    if (typeof body.transactionId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(body.transactionId) ||
        !Number.isSafeInteger(body.version) || !Array.isArray(body.events) || !body.events.length) throw new Error('잘못된 저장 요청');
    const json = JSON.stringify(body.events);
    if (json.length > 45000) throw new Error('저장 요청이 너무 큽니다.');
    const previous = rows.slice(1).find(function(row) { return row[0] === body.transactionId; });
    if (previous) {
      if (previous[1] !== json) throw new Error('동일 요청 ID의 내용이 다릅니다.');
      return { saved: true, version: version, existing: true };
    }
    if (body.version !== version) return { saved: false, conflict: true, version: version };
    const ids = new Set();
    rows.slice(1).forEach(function(row) { JSON.parse(row[1]).forEach(function(event) { ids.add(event.id); }); });
    body.events.forEach(function(event) {
      if (!event || typeof event.id !== 'string' || !event.actor || !event.requestId || !event.type ||
          !Number.isFinite(Date.parse(event.at)) || ids.has(event.id)) throw new Error('중복되거나 잘못된 이력');
      ids.add(event.id);
    });
    // JSON starts with '[' and the constrained transaction ID cannot become a sheet formula.
    sheet.getRange(rows.length + 1, 1, 1, 2).setValues([[body.transactionId, json]]);
    SpreadsheetApp.flush();
    return { saved: true, version: version + 1 };
  } finally { lock.releaseLock(); }
}
