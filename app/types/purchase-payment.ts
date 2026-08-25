export interface PurchasePaymentList {
  id: string;
  payment_number: string;
  supplier_id: string;
  supplier_name: string;
  payment_date: string;
  payment_mode: string;
  total_paid_amount: number;
  admin_fee_amount: number;
  discount_amount: number;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  created_at: string;
}

export interface PurchasePaymentItem {
  id?: string;
  purchase_invoice_id: string;
  invoice_number?: string;
  supplier_invoice_number?: string;
  invoice_total_amount?: number;
  invoice_outstanding_amount?: number;
  paid_amount: number;
}

export interface PurchasePaymentDetail {
  id: string;
  payment_number: string;
  reference_no?: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code?: string;
  payment_date: string;
  payment_mode: string;
  giro_number?: string;
  giro_due_date?: string;
  admin_fee_amount: number;
  discount_amount: number;
  wht_amount: number;
  total_paid_amount: number;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  posted_at?: string;
  posted_by_name?: string;
  notes?: string;
  created_at: string;
  items: PurchasePaymentItem[];
}
