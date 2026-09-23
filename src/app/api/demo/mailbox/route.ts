import { NextRequest, NextResponse } from 'next/server';
import { getBackendAdapter } from '@/services/googleAppsScriptAdapter';
import { MockBackendAdapter } from '@/services/mockBackendAdapter';
import { clearSentRegistry } from '@/lib/idempotency';

export async function GET() {
  const adapter = getBackendAdapter();
  if (adapter.getMockMailbox) {
    const mailbox = await adapter.getMockMailbox();
    return NextResponse.json({ success: true, mailbox });
  }
  return NextResponse.json({ success: true, mailbox: [] });
}

export async function POST(req: NextRequest) {
  try {
    MockBackendAdapter.clearMailbox();
    clearSentRegistry();
    return NextResponse.json({ success: true, message: '데모 메일함 및 발송 레지스트리가 초기화되었습니다.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
