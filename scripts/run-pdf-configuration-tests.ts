import assert from 'node:assert/strict';
import { PRODUCTS_CONFIG } from '../src/config/products';
import { getPaymentAccountInfo } from '../src/config/paymentAccount';
import { assertPageFits, fitRasterToA4 } from '../src/lib/pdfGenerator';

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
// No A4 content may be discarded. A 10% taller page must still fit on one page.
const standardA4 = fitRasterToA4(2100, 2970);
assert.equal(standardA4.widthMm, 210);
assert.equal(standardA4.heightMm, 297);
const dense = fitRasterToA4(2100, 3300);
assert.ok(dense.scale > 0.89 && dense.scale < 0.91);
assert.equal(dense.heightMm, 297);
assert.ok(dense.xMm > 0);
assert.throws(() => fitRasterToA4(2100, 4500), /너무 길어/);
assert.throws(() => fitRasterToA4(0, 100), /크기/);
console.log('PDF safety & product config checks: all passed');
