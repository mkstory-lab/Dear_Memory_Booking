import { NextRequest, NextResponse } from 'next/server';
import { getBackendAdapter } from '@/services/googleAppsScriptAdapter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = (body.code || '').trim();

    if (!code) {
      return NextResponse.json({
        success: true,
        valid: false,
        code: '',
        discountAmount: 0,
        message: '짝꿍 코드를 입력해 주세요.',
      });
    }

    const adapter = getBackendAdapter();
    const result = await adapter.validatePartnerCode(code);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        valid: false,
        code: '',
        discountAmount: 0,
        error: `짝꿍 코드 검증 중 오류가 발생했습니다: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
