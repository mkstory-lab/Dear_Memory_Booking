import assert from 'node:assert/strict';
import { PRODUCTS_CONFIG } from '../src/config/products';
import { getPaymentAccountInfo } from '../src/config/paymentAccount';
import { assertPageFits, chooseSafePageCut } from '../src/lib/pdfGenerator';

const standard = PRODUCTS_CONFIG.find((item) => item.id === 'standard');
const albumPlus = PRODUCTS_CONFIG.find((item) => item.id === 'album_plus');
assert.ok(standard && albumPlus, 'Both products must exist');
assert.equal(standard.retouchedCount, 70);
assert.equal(standard.originalCount, '2,000장 이상');
assert.equal(albumPlus.retouchedCount, 80);
assert.equal(albumPlus.originalCount, '3,000장 이상');
assert.ok(albumPlus.includedItems.some((item) => item.includes('80장') && item.includes('3,000장')));

delete process.env.NEXT_PUBLIC_DEAR_MEMORY_BANK_NAME;
delete process.env.NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_NUMBER;
delete process.env.NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_HOLDER;
assert.equal(getPaymentAccountInfo(), null, 'Missing account details must never be invented');
process.env.NEXT_PUBLIC_DEAR_MEMORY_BANK_NAME = '테스트은행';
assert.equal(getPaymentAccountInfo(), null, 'Partial account details must not appear');
process.env.NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_NUMBER = '123-TEST';
process.env.NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_HOLDER = '테스트예금주';
assert.deepEqual(getPaymentAccountInfo(), {
  bankName: '테스트은행',
  accountNumber: '123-TEST',
  accountHolder: '테스트예금주',
});

assert.doesNotThrow(() => assertPageFits({
  scrollHeight: 100, clientHeight: 100, scrollWidth: 70, clientWidth: 70,
}));
assert.throws(() => assertPageFits({
  scrollHeight: 105, clientHeight: 100, scrollWidth: 70, clientWidth: 70,
}), /A4/);
assert.throws(() => assertPageFits({
  scrollHeight: 100, clientHeight: 100, scrollWidth: 75, clientWidth: 70,
}), /A4/);
assert.equal(chooseSafePageCut(0, 1000, [200, 700, 850]), 850);
assert.equal(chooseSafePageCut(0, 1000, [200, 400]), 1000);
console.log('PDF safety & product config checks: all passed');
