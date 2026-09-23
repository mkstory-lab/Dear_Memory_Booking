import crypto from 'crypto';
import { ContractFormData } from '@/types/contract';

const DEFAULT_SECRET = 'dear-memory-contract-secret-salt-2026-wedding-ops-key';
const SECRET_KEY = process.env.APP_SECRET || DEFAULT_SECRET;

// 32바이트 키 유도를 위한 SHA-256 해시
const KEY_32 = crypto.createHash('sha256').update(SECRET_KEY).digest();

export interface DecodedApprovalPayload {
  contractId: string;
  data: ContractFormData;
  iat: number;
  exp: number;
}

/**
 * 보안 승인 토큰 생성 (AES-256-CBC 암호화 + HMAC-SHA256 무결성 서명)
 * URL에 고객 개인정보가 평문으로 노출되지 않도록 완전 암호화합니다.
 */
export function createApprovalToken(contractId: string, data: ContractFormData, expiresInMs = 14 * 24 * 60 * 60 * 1000): string {
  const payload: DecodedApprovalPayload = {
    contractId,
    data,
    iat: Date.now(),
    exp: Date.now() + expiresInMs,
  };

  const jsonStr = JSON.stringify(payload);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY_32, iv);
  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);

  // payloadPart: iv(16 bytes) + encrypted
  const cipherBlob = Buffer.concat([iv, encrypted]);
  const payloadBase64 = cipherBlob.toString('base64url');

  // HMAC 서명
  const signature = crypto.createHmac('sha256', KEY_32).update(payloadBase64).digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * 보안 승인 토큰 검증 및 복호화
 */
export function verifyApprovalToken(token: string): DecodedApprovalPayload {
  if (!token || !token.includes('.')) {
    throw new Error('유효하지 않은 토큰 형식입니다.');
  }

  const [payloadBase64, providedSig] = token.split('.');
  if (!payloadBase64 || !providedSig) {
    throw new Error('토큰 정보가 누락되었습니다.');
  }

  // 1. HMAC 서명 검증 (Timing-safe)
  const expectedSig = crypto.createHmac('sha256', KEY_32).update(payloadBase64).digest('base64url');
  const bufProvided = Buffer.from(providedSig);
  const bufExpected = Buffer.from(expectedSig);

  if (bufProvided.length !== bufExpected.length || !crypto.timingSafeEqual(bufProvided, bufExpected)) {
    throw new Error('토큰의 서명이 일치하지 않거나 위변조되었습니다.');
  }

  // 2. 복호화
  try {
    const cipherBlob = Buffer.from(payloadBase64, 'base64url');
    if (cipherBlob.length < 17) {
      throw new Error('암호화 데이터 길이가 올바르지 않습니다.');
    }
    const iv = cipherBlob.subarray(0, 16);
    const encrypted = cipherBlob.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY_32, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const payload: DecodedApprovalPayload = JSON.parse(decrypted.toString('utf8'));

    // 3. 유효기간 만료 검증
    if (payload.exp && Date.now() > payload.exp) {
      throw new Error('승인 링크의 유효 기간이 만료되었습니다. 대표에게 문의해 주세요.');
    }

    return payload;
  } catch (err: any) {
    if (err.message.includes('만료')) throw err;
    throw new Error(`토큰 복호화에 실패했습니다: ${err.message}`);
  }
}
