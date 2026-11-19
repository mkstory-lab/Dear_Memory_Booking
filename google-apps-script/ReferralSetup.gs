/** Owner-only setup. Never run on contract submission or sending. */
function dmReferralOwner_() {
  const active = (Session.getActiveUser().getEmail() || '').toLowerCase();
  const owner = (PropertiesService.getScriptProperties().getProperty('DM_REFERRAL_ADMIN_EMAIL') || '').toLowerCase();
  if (!active || !owner || active !== owner) throw new Error('프로젝트 소유자 Google 계정으로 로그인해 주세요.');
  return active;
}
function dmReferralSetupPage_() {
  dmReferralOwner_();
  return HtmlService.createHtmlOutput('<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{max-width:640px;margin:40px auto;padding:20px;font:16px system-ui;background:#faf8f4;line-height:1.8}button{padding:14px;font:inherit}textarea{width:100%;min-height:130px;font:14px monospace}p{white-space:pre-wrap}</style><h1>디어메모리 추천 관리 연결</h1><p>기존 계약 데이터는 변경하지 않습니다. 처음 설정하면 추천 이력용 비공개 스프레드시트 한 개를 새로 만듭니다. 고객 메일이나 코드를 발급하지 않습니다.</p><button id="setup">추천 관리 저장소 준비</button><p id="status"></p><div id="result" hidden><p>아래 값은 서버 연결용 비밀키입니다. 대화창에 보내지 마세요. Vercel의 REFERRAL_JOURNAL_SECRET 환경변수에만 입력합니다.</p><textarea id="secret" readonly></textarea></div><script>document.getElementById("setup").onclick=function(){this.disabled=true;document.getElementById("status").textContent="준비 중입니다…";google.script.run.withSuccessHandler(function(r){document.getElementById("status").textContent="저장소가 준비되었습니다. 기존 데이터는 변경하지 않았습니다.";document.getElementById("secret").value=r.secret;document.getElementById("result").hidden=false;document.getElementById("setup").disabled=false;}).withFailureHandler(function(){document.getElementById("status").textContent="설정을 완료하지 못했습니다. 프로젝트 소유자 로그인과 실행 권한을 확인해 주세요.";document.getElementById("setup").disabled=false;}).dmReferralSetup();};</script></html>').setTitle('DEAR MEMORY 추천 관리 연결');
}
function dmReferralSetup() {
  dmReferralOwner_();
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    let id = props.getProperty('DM_REFERRAL_SHEET_ID');
    if (!id) {
      const ss = SpreadsheetApp.create('DEAR MEMORY 추천 관리 이력');
      id = ss.getId();
      // Record the new ID immediately so a retry does not create another sheet.
      props.setProperty('DM_REFERRAL_SHEET_ID', id);
    }
    const ss = SpreadsheetApp.openById(id);
    let sheet = ss.getSheetByName('ReferralJournal');
    if (!sheet) sheet = ss.insertSheet('ReferralJournal');
    if (!sheet.getLastRow()) sheet.getRange(1, 1, 1, 2).setValues([['transaction_id', 'events_json']]);
    let secret = props.getProperty('DM_REFERRAL_SECRET');
    if (!secret) { secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); props.setProperty('DM_REFERRAL_SECRET', secret); }
    SpreadsheetApp.flush();
    return { ready: true, secret: secret };
  } finally { lock.releaseLock(); }
}

/** Run manually from the Apps Script editor only. Trailing underscore blocks google.script.run. */
function dmInitializeReferrals_() {
  const active = (Session.getActiveUser().getEmail() || '').toLowerCase();
  const effective = (Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (!active || active !== effective) throw new Error('소유자 계정의 편집기에서 실행해 주세요.');
  const props = PropertiesService.getScriptProperties();
  const prior = props.getProperty('DM_REFERRAL_ADMIN_EMAIL');
  if (prior && prior !== active) throw new Error('기존 관리자 계정은 자동 변경하지 않습니다.');
  props.setProperty('DM_REFERRAL_ADMIN_EMAIL', active);
  dmReferralSetup();
  // Do not log or return the connection secret from the editor execution.
}
