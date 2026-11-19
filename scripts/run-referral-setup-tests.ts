import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync('google-apps-script/ReferralSetup.gs', 'utf8');
function runtime(email: string, owner: string | null) {
  const c = vm.createContext({ Session: { getActiveUser: () => ({ getEmail: () => email }), getEffectiveUser: () => ({ getEmail: () => email }) }, PropertiesService: { getScriptProperties: () => ({ getProperty: () => owner }) } });
  new vm.Script(source).runInContext(c); return c;
}
test('setup denies anonymous and non-owner Google users even when executing as themselves', () => {
  assert.throws(() => runtime('', 'owner@example.invalid').dmReferralOwner_(), /소유자/);
  assert.throws(() => runtime('attacker@example.invalid', 'owner@example.invalid').dmReferralOwner_(), /소유자/);
  assert.throws(() => runtime('owner@example.invalid', null).dmReferralOwner_(), /소유자/);
  assert.equal(runtime('owner@example.invalid', 'owner@example.invalid').dmReferralOwner_(), 'owner@example.invalid');
});
