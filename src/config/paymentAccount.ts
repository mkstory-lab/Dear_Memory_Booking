/**
 * Customer-visible transfer instructions for the generated contract.
 * Do not commit real bank details; configure them via NEXT_PUBLIC_ build variables.
 */
export interface PaymentAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export function getPaymentAccountInfo(): PaymentAccountInfo | null {
  const bankName = (process.env.NEXT_PUBLIC_DEAR_MEMORY_BANK_NAME || '').trim();
  const accountNumber = (process.env.NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_NUMBER || '').trim();
  const accountHolder = (process.env.NEXT_PUBLIC_DEAR_MEMORY_ACCOUNT_HOLDER || '').trim();

  // Incomplete account details must never be shown as if they were verified.
  if (!bankName || !accountNumber || !accountHolder) return null;
  return { bankName, accountNumber, accountHolder };
}
