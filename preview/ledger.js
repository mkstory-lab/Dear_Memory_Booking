/** Pure referral ledger. Persist each command's events atomically under a server-side lock. */
export const POLICY = { version: '2026-11-19', amount: 50000 };
export function project(events) {
    const s = { contracts: {}, codes: {}, referrals: {}, benefits: {}, entries: [] };
    for (const e of events) {
        const d = e.data;
        switch (e.type) {
            case 'contract_registered':
                s.contracts[d.id] = { ...d };
                break;
            case 'contract_updated':
                Object.assign(s.contracts[d.id], d.patch);
                break;
            case 'code_issued':
                s.codes[d.value] = { ...d };
                break;
            case 'code_status':
                s.codes[d.code].active = d.active;
                break;
            case 'referral_entered':
                s.referrals[d.id] = { ...d };
                break;
            case 'referral_confirmed':
                s.referrals[d.id].confirmedAt = e.at;
                break;
            case 'referral_cancelled':
                s.referrals[d.id].cancelledAt = e.at;
                break;
            case 'benefit_granted':
                s.benefits[d.id] = { ...d };
                break;
            case 'benefit_entry':
                s.entries.push({ ...d });
                break;
        }
    }
    return s;
}
export function amounts(s, benefit) {
    const sum = (kind) => s.entries.filter(e => e.benefitId === benefit.id && e.kind === kind).reduce((n, e) => n + e.amount, 0);
    const balance = sum('balance'), paid = sum('payout') - sum('payout_correction'), cancelled = sum('cancel');
    return { granted: benefit.amount, balance, paid, cancelled, waived: sum('waiver'), available: benefit.amount - balance - paid - cancelled };
}
export function remainingBalance(s, id) {
    const c = s.contracts[id];
    const deducted = Object.values(s.benefits).filter(b => b.contractId === id).reduce((n, b) => n + amounts(s, b).balance, 0);
    return Math.max(0, c.total - c.paid - deducted);
}
export const normalizeCode = (code) => code.trim().toUpperCase();
export function validCode(s, value) { return !!s.codes[normalizeCode(value)]?.active; }
function requireThat(value, message) { if (!value)
    throw new Error(message); }
function money(n) { requireThat(Number.isSafeInteger(n) && n > 0, '금액은 1원 이상의 정수여야 합니다.'); }
export function execute(history, command, ctx) {
    requireThat(ctx.actor && ctx.requestId && Number.isFinite(Date.parse(ctx.at)), '처리자·요청 ID·시각이 필요합니다.');
    const customerAllowed = ['refer', 'remove_referral'];
    if (ctx.role !== 'admin') {
        requireThat(customerAllowed.includes(command.type) && 'contractId' in command && command.contractId === ctx.customerContractId, '관리자 권한이 필요합니다.');
    }
    const previous = history.find(e => e.requestId === ctx.requestId && e.type === 'command');
    if (previous) {
        requireThat(previous.actor === ctx.actor && JSON.stringify(previous.data) === JSON.stringify(command), '같은 요청 ID에 다른 작업을 사용할 수 없습니다.');
        return [];
    }
    let s = project(history);
    const pending = [];
    const emit = (type, data) => {
        pending.push({ id: `${ctx.requestId}:${pending.length}`, requestId: ctx.requestId, actor: ctx.actor, at: ctx.at, reason: ctx.reason || '', type, data });
        s = project([...history, ...pending]);
    };
    const entry = (benefitId, kind, amount, extra = {}) => {
        if (amount > 0)
            emit('benefit_entry', { id: `${ctx.requestId}:entry:${pending.length}`, benefitId, kind, amount, ...extra });
    };
    const currentReferral = (id) => Object.values(s.referrals).find(r => r.contractId === id && !r.cancelledAt);
    const benefitList = (id) => Object.values(s.benefits).filter(b => b.contractId === id);
    const allocate = (id) => {
        for (const b of benefitList(id))
            entry(b.id, 'balance', Math.min(remainingBalance(s, id), amounts(s, b).available));
    };
    const cancelReferral = (r) => {
        emit('referral_cancelled', { id: r.id });
        for (const b of Object.values(s.benefits).filter(b => b.referralId === r.id)) {
            const a = amounts(s, b);
            entry(b.id, 'cancel', a.available);
            entry(b.id, 'waiver', a.balance + a.paid);
        }
    };
    if (command.type === 'register') {
        const c = command.contract;
        requireThat(c.id && c.coupleId && !s.contracts[c.id], '기존 계약의 내부 ID를 유지해 주세요.');
        requireThat(!Object.values(s.contracts).some(x => x.coupleId === c.coupleId), '이미 등록된 커플입니다. 기존 계약을 선택해 주세요.');
        requireThat(c.number !== 'DM-20270516-XJWF' || c.status === 'cancelled', '취소된 계약은 활성 등록할 수 없습니다.');
        requireThat(Number.isSafeInteger(c.total) && c.total >= 0 && Number.isSafeInteger(c.deposit) && c.deposit > 0 && c.deposit <= c.total, '계약금액을 확인해 주세요.');
        requireThat(c.paid === 0 && !c.depositConfirmedAt, '입금은 별도 수동 확인으로 기록합니다.');
        emit('contract_registered', c);
    }
    else if (command.type === 'code_status') {
        requireThat(s.codes[command.code], '코드를 찾을 수 없습니다.');
        requireThat(ctx.reason, '변경 사유를 입력해 주세요.');
        emit('code_status', command);
    }
    else if (command.type === 'correct_payout') {
        money(command.amount);
        requireThat(ctx.reason, '정정 사유가 필요합니다.');
        let left = command.amount;
        const paidEntries = s.entries.filter(e => e.kind === 'payout' && e.paymentId === command.paymentId);
        const outstanding = (e) => e.amount - s.entries.filter(x => x.kind === 'payout_correction' && x.corrects === e.id).reduce((n, x) => n + x.amount, 0);
        requireThat(paidEntries.reduce((n, e) => n + outstanding(e), 0) >= left, '정정 금액이 지급액을 초과합니다.');
        for (const e of paidEntries) {
            const amount = Math.min(left, outstanding(e));
            entry(e.benefitId, 'payout_correction', amount, { corrects: e.id, paymentId: command.paymentId });
            const b = s.benefits[e.benefitId];
            if (s.referrals[b.referralId].cancelledAt) {
                entry(b.id, 'cancel', amount);
                // This is an audit correction, not a recovery request to the customer.
                if (amount)
                    emit('benefit_entry', { id: `${ctx.requestId}:waiver:${pending.length}`, benefitId: b.id, kind: 'waiver', amount: -amount });
            }
            left -= amount;
        }
    }
    else {
        const c = s.contracts[command.contractId];
        requireThat(c, '계약을 찾을 수 없습니다.');
        requireThat(c.status !== 'cancelled' || command.type === 'cancel', '취소된 계약입니다.');
        switch (command.type) {
            case 'update':
                requireThat(ctx.reason, '변경 사유가 필요합니다.');
                requireThat(command.number !== 'DM-20270516-XJWF', '취소된 계약번호입니다.');
                emit('contract_updated', { id: c.id, patch: { number: command.number, weddingDate: command.weddingDate }, before: c });
                break;
            case 'sent':
                emit('contract_updated', { id: c.id, patch: { sentAt: c.sentAt || ctx.at } });
                break;
            case 'issue': {
                requireThat(c.depositConfirmedAt, '계약금 입금을 먼저 확인해 주세요.');
                if (Object.values(s.codes).some(code => code.contractId === c.id))
                    break;
                requireThat(/^DM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(command.candidate) && !s.codes[command.candidate], '코드 충돌 또는 형식 오류입니다.');
                emit('code_issued', { value: command.candidate, contractId: c.id, coupleId: c.coupleId, active: true, issuedAt: ctx.at });
                break;
            }
            case 'refer': {
                const code = s.codes[normalizeCode(command.code)];
                requireThat(code?.active, '유효한 짝꿍코드를 입력해 주세요.');
                requireThat(code.coupleId !== c.coupleId, '자기 추천은 적용할 수 없습니다.');
                requireThat(!c.depositConfirmedAt, '계약금 확인 후 추천 변경은 별도 정산 검토가 필요합니다.');
                if (c.sentAt)
                    requireThat(ctx.role === 'admin' && ctx.reason, '발송 후에는 대표가 사유를 기록해야 합니다.');
                const old = currentReferral(c.id);
                if (old?.code === code.value)
                    break;
                requireThat(!old || (ctx.role === 'admin' && ctx.reason), '한 계약에는 하나의 코드만 적용할 수 있습니다. 기존 코드를 해제해 주세요.');
                if (old)
                    cancelReferral(old);
                emit('referral_entered', { id: `${ctx.requestId}:referral`, contractId: c.id, ownerContractId: code.contractId, code: code.value, enteredAt: ctx.at, policy: { ...POLICY } });
                break;
            }
            case 'remove_referral': {
                requireThat(!c.depositConfirmedAt, '혜택 확정 후에는 정산 검토가 필요합니다.');
                if (c.sentAt)
                    requireThat(ctx.role === 'admin' && ctx.reason, '발송 후에는 대표가 사유를 기록해야 합니다.');
                const old = currentReferral(c.id);
                if (old)
                    cancelReferral(old);
                break;
            }
            case 'deposit': {
                if (c.depositConfirmedAt)
                    break;
                emit('contract_updated', { id: c.id, patch: { depositConfirmedAt: ctx.at, paid: c.paid + c.deposit } });
                const r = currentReferral(c.id);
                if (r && !r.confirmedAt) {
                    emit('referral_confirmed', { id: r.id });
                    for (const kind of ['owner', 'new_customer']) {
                        emit('benefit_granted', { id: `${r.id}:${kind}`, referralId: r.id, contractId: kind === 'owner' ? r.ownerContractId : c.id, kind, amount: r.policy.amount, policy: r.policy });
                    }
                    allocate(c.id);
                    allocate(r.ownerContractId);
                }
                break;
            }
            case 'apply_balance':
                allocate(c.id);
                break;
            case 'payment':
                money(command.amount);
                requireThat(c.depositConfirmedAt && command.amount <= remainingBalance(s, c.id), '입금 확인 상태와 남은 잔금을 확인해 주세요.');
                emit('contract_updated', { id: c.id, patch: { paid: c.paid + command.amount } });
                break;
            case 'payout': {
                money(command.amount);
                requireThat(command.paymentId && Number.isFinite(Date.parse(command.paidAt)), '지급 식별자와 지급일이 필요합니다.');
                requireThat(!s.entries.some(e => e.paymentId === command.paymentId), '이미 기록된 지급입니다.');
                requireThat(remainingBalance(s, c.id) === 0, '먼저 남은 잔금에 혜택을 적용해 주세요.');
                const list = benefitList(c.id);
                requireThat(list.reduce((n, b) => n + amounts(s, b).available, 0) >= command.amount, '지급 예정액을 초과합니다.');
                let left = command.amount;
                for (const b of list) {
                    const amount = Math.min(left, amounts(s, b).available);
                    entry(b.id, 'payout', amount, { paymentId: command.paymentId });
                    left -= amount;
                }
                break;
            }
            case 'cancel':
                requireThat(ctx.reason, '취소 사유가 필요합니다.');
                if (c.status === 'cancelled')
                    break;
                emit('contract_updated', { id: c.id, patch: { status: 'cancelled' } });
                const r = currentReferral(c.id);
                if (r)
                    cancelReferral(r);
                break;
        }
    }
    emit('command', command);
    return pending;
}
