import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeWeddings,validDate,type Wedding} from '../src/lib/admin/unifiedWeddingCalendar';
const base:Wedding={date:'2026-01-03',time:'14:00',groom:'신랑',bride:'신부',venue:'구로 지타워컨벤션',hall:'',source:'기존 엑셀',note:''};
test('date validation',()=>{assert.equal(validDate('2025-12-31'),false);assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2026-01-01'),true);});
test('duplicate source merge',()=>{const x=mergeWeddings([base,{...base,venue:'지타워 웨딩홀',hall:'2층 단독홀',source:'관리자 계약서'}]);assert.equal(x.length,1);assert.equal(x[0].source,'엑셀 + 관리자 계약서');});
test('different couples and dates kept',()=>{assert.equal(mergeWeddings([base,{...base,bride:'다른 신부'},{...base,date:'2026-01-04'}]).length,3);});
test('missing fields not silently deduped',()=>{assert.equal(mergeWeddings([{...base,time:''},{...base,time:''}]).length,2);});
