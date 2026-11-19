import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const source = readFileSync('google-apps-script/Code.gs', 'utf8');
function sandbox() {
  const calls: string[] = [];
  const context = vm.createContext({
    Logger: { log() {} },
    GmailApp: { sendEmail() { calls.push('mail'); } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (_a: string, value: string) => [...createHash('sha256').update(value).digest()] },
  });
  new vm.Script(source).runInContext(context);
  return { context, calls };
}
const data = { groomName: '가상신랑', brideName: '가상신부', weddingDate: '2027-06-01', weddingTime: '13:30', weddingVenue: '테스트예식장', weddingHall: '테스트홀', email: 'test@example.invalid', productId: 'album_plus', optionIds: [] };
test('uploaded baseline compiles and keeps Excel/PDF/Calendar entry points', () => {
  const { context } = sandbox();
  for (const name of ['doPost', 'createContractExcelBlob', 'contractPdfPageImages', 'dmSyncCalendar_', 'dmAfterContractSent_']) assert.equal(typeof context[name], 'function');
  const template = context.contractExcelTemplate();
  assert.ok(template.xml['xl/worksheets/sheet3.xml']);
  assert.ok(Object.keys(template.binary).length);
});
test('known cancelled contract is excluded before Calendar access', () => {
  const { context } = sandbox();
  assert.throws(() => context.dmCalendarSpec_(data, 'DM-20270516-XJWF'), /취소/);
  assert.throws(() => context.dmCalendarSpec_({ ...data, groomName: '이송현', brideName: '이수정', weddingDate: '2027-05-16' }, 'OTHER'), /취소/);
});
test('Calendar spec preserves title and validates wedding date', () => {
  const { context } = sandbox();
  assert.equal(context.dmCalendarSpec_(data, 'TEST').title, '테스트예식장/13:30/가상신부');
  assert.throws(() => context.dmCalendarSpec_({ ...data, weddingDate: '2027-02-30' }, 'TEST'), /유효하지/);
});
test('missing previously registered Calendar event is never recreated', () => {
  const { context } = sandbox(); let released = false;
  context.DriveApp = { getFolderById: () => ({ isTrashed: () => false, getFiles: () => ({ hasNext: () => true, next: () => ({ isTrashed: () => false, getName: () => 'TEST_contract.pdf', getUrl: () => 'fake' }) }) }) };
  context.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() { released = true; } }) };
  context.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 'previous-event' }) };
  context.CalendarApp = { getCalendarById: () => ({ getEventById: () => null, createAllDayEvent() { assert.fail('must not recreate'); } }) };
  assert.throws(() => context.dmSyncCalendar_(data, 'TEST', 'https://drive.google.com/drive/folders/fake'), /자동 복원하지/);
  assert.ok(released);
});
test('storage failure remains separate from customer email result', () => {
  const { context, calls } = sandbox();
  context.saveContractToGoogleDrive = () => { throw new Error('simulated storage failure'); };
  context.dmAfterContractSent_ = () => ({ saved: false, error: 'simulated' });
  const result = context.handleApproveAndSend({ updatedData: data, contractNumber: 'TEST' });
  assert.deepEqual(calls, ['mail']);
  assert.equal(result.customerEmailSent, true);
  assert.equal(result.driveSaved, false);
  assert.equal(result.calendarSaved, false);
});
test('all original mail, Drive, PDF, Excel and Calendar functions remain identical after normalizing line endings', async () => {
  const ts = await import('typescript');
  const expected = JSON.parse(readFileSync('docs/referral-backup/function-hashes.json', 'utf8'));
  const ast = ts.createSourceFile('Code.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const actual: Record<string, string> = {};
  ast.forEachChild(n => { if (ts.isFunctionDeclaration(n) && n.name) actual[n.name.text] = createHash('sha256').update(n.getText(ast)).digest('hex'); });
  for (const [name, hash] of Object.entries(expected)) assert.equal(actual[name], hash, `${name} must be preserved`);
});
