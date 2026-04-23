export interface FlutterwaveTransferResponse {
  status: string;
  message: string;
  data: {
    id: string;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: unknown;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}
