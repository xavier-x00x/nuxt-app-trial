export interface PurchaseReturnList {
  id: string;
  return_number: string;
  purchase_invoice_id: string;
  invoice_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  return_date: string;
  total_amount: number;
  tax_amount: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  created_at: string;
}

export interface PurchaseReturnItem {
  id?: string;
  purchase_invoice_item_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  uom_id: string;
  uom_name?: string;
  qty_return: number;
  unit_price: number;
  discount_amount: number;
  tax_pct: number;
}

export interface PurchaseReturnDetail {
  id: string;
  return_number: string;
  purchase_invoice_id: string;
  invoice_number?: string;
  supplier_name?: string;
  return_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  notes?: string;
  created_at: string;
  items: PurchaseReturnItem[];
}
