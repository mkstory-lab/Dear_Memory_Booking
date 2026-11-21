import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Event } from '@/lib/referrals/ledger';

export type StaffRecord = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StaffAssignment = {
  contractId: string;
  staffIds: string[];
  updatedAt: string;
};

export type StaffState = {
  staff: Record<string, StaffRecord>;
  assignments: Record<string, StaffAssignment>;
};

export function normalizeStaffUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateStaffUsername(value: string) {
  const username = normalizeStaffUsername(value);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('작가 아이디는 영문 소문자, 숫자, ., _, - 조합 3~32자로 입력해 주세요.');
  return username;
}

export function hashStaffPassword(password: string, salt = randomBytes(16).toString('hex')) {
  if (password.length < 8 || password.length > 128) throw new Error('작가 비밀번호는 8~128자로 입력해 주세요.');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function staffPasswordMatches(password: unknown, stored: string) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [salt, hex, extra] = stored.split(':');
  if (extra || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hex || '')) return false;
  const expected = Buffer.from(hex, 'hex');
  const supplied = scryptSync(password, salt, 64);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function projectStaff(events: Event[]): StaffState {
  const state: StaffState = { staff: {}, assignments: {} };
  for (const event of events) {
    const data = event.data || {};
    if (event.type === 'crm_staff_created') {
      state.staff[data.id] = {
        id: data.id,
        username: data.username,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
        active: data.active !== false,
        createdAt: event.at,
        updatedAt: event.at,
      };
    } else if (event.type === 'crm_staff_password_changed' && state.staff[data.staffId]) {
      state.staff[data.staffId].passwordHash = data.passwordHash;
      state.staff[data.staffId].updatedAt = event.at;
    } else if (event.type === 'crm_staff_status_changed' && state.staff[data.staffId]) {
      state.staff[data.staffId].active = !!data.active;
      state.staff[data.staffId].updatedAt = event.at;
    } else if (event.type === 'crm_staff_name_changed' && state.staff[data.staffId]) {
      state.staff[data.staffId].displayName = data.displayName;
      state.staff[data.staffId].updatedAt = event.at;
    } else if (event.type === 'crm_staff_assignment_set') {
      state.assignments[data.contractId] = {
        contractId: data.contractId,
        staffIds: Array.isArray(data.staffIds) ? [...new Set(data.staffIds.map(String))] : [],
        updatedAt: event.at,
      };
    }
  }
  return state;
}

export function publicStaff(state: StaffState) {
  return Object.values(state.staff).map(({ passwordHash: _passwordHash, ...staff }) => staff)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));
}
