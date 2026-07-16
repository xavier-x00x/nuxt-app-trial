export interface GoodsReceiptItem {
  id: string;
  seq_no: number;
  purchase_order_item_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  uom_id: string;
  uom_code: string;
  base_uom_name?: string;
  conversion_rate?: number;
  qty_ordered: number;
  qty_received: number;
  qty_rejected: number;
  unit_price: number;
  discount_1_pct?: number;
  discount_2_pct?: number;
  discount_3_pct?: number;
  discount_amount?: number;
  total_discount_amount?: number;
  tax_pct?: number;
  tax_amount?: number;
  landed_cost_amount?: number;
  net_unit_price: number;
  reject_reason?: string;
  notes?: string;
}

export interface GoodsReceiptList {
  id: string;
  gr_number: string;
  purchase_order_id: string;
  po_number: string;
  warehouse_id: string;
  warehouse_name: string;
  receipt_date: string;
  delivery_note_no?: string;
  status: string;
  received_by_id: string;
  supplier_name: string;
  store_name: string;
  created_at: string;
}

export interface GoodsReceiptDetail {
  id: string;
  gr_number: string;
  purchase_order_id: string;
  po_number: string;
  warehouse_id: string;
  warehouse_name: string;
  receipt_date: string;
  delivery_note_no?: string;
  status: string;
  received_by_id: string;
  confirmed_by_id?: string;
  confirmed_at?: string;
  notes?: string;
  is_over_received_override: boolean;
  override_approved_by_id?: string;
  created_at: string;
  updated_at: string;
  supplier_name: string;
  supplier_code: string;
  supplier_address?: string;
  store_name: string;
  subtotal: number;
  promo_marketing_discount_percentage: number;
  promo_marketing_discount_amount: number;
  discount_amount: number;
  tax_amount: number;
  freight_amount: number;
  other_cost_amount: number;
  grand_total: number;
  is_tax_inclusive: boolean;
  items: GoodsReceiptItem[];
}

export interface CreateGoodsReceiptPayload {
  purchase_order_id: string;
  warehouse_id: string;
  receipt_date: string;
  delivery_note_no?: string;
  notes?: string;
  override_pin?: string;
  items: {
    purchase_order_item_id: string;
    product_id: string;
    uom_id: string;
    qty_received: number;
    qty_rejected: number;
    unit_price: number;
    reject_reason?: string;
    notes?: string;
  }[];
}

export interface UpdateGoodsReceiptPayload {
  receipt_date: string;
  delivery_note_no?: string;
  notes?: string;
  override_pin?: string;
  items: {
    purchase_order_item_id: string;
    product_id: string;
    uom_id: string;
    qty_received: number;
    qty_rejected: number;
    unit_price: number;
    reject_reason?: string;
    notes?: string;
  }[];
}

export interface CreateGoodsReceiptWithInvoicePayload extends CreateGoodsReceiptPayload {
  supplier_invoice_number: string;
  invoice_date: string;
  ap_account_id: string;
  payment_term_days: number;
  discount_amount: number;
}
