export interface PurchaseInvoiceList {
  id: string;
  invoice_number: string;
  supplier_invoice_number: string;
  purchase_order_id: string;
  po_number?: string;
  supplier_id: string;
  supplier_name: string;
  store_name?: string;
  warehouse_name?: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  tax_amount: number;
  outstanding_amount: number;
  status: "DRAFT" | "POSTED" | "PAID" | "PARTIALLY_PAID" | "CANCELLED";
  created_at: string;
}

export interface PurchaseInvoiceItem {
  id?: string;
  purchase_order_item_id?: string;
  goods_receipt_item_id?: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  uom_id: string;
  uom_name?: string;
  qty_invoiced: number;
  unit_price: number;
  discount_amount: number;
  tax_pct: number;
  subtotal?: number;
  notes?: string;
}

export interface PurchaseInvoiceDetail {
  id: string;
  invoice_number: string;
  supplier_invoice_number: string;
  reference_no?: string;
  purchase_order_id: string;
  po_number?: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code?: string;
  store_id: string;
  store_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  invoice_date: string;
  received_date: string;
  due_date: string;
  payment_term_days: number;
  payment_mode: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  freight_amount: number;
  other_cost_amount: number;
  total_amount: number;
  outstanding_amount: number;
  is_tax_inclusive: boolean;
  status: "DRAFT" | "POSTED" | "PAID" | "PARTIALLY_PAID" | "CANCELLED";
  posted_at?: string;
  posted_by_name?: string;
  notes?: string;
  created_at: string;
  items: PurchaseInvoiceItem[];
}
