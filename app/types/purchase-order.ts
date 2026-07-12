export interface PurchaseOrderItem {
  id?: string;
  purchase_order_id?: string;
  seq_no?: number;
  product_id: string;
  product_sku?: string;
  product_name?: string;
  uom_id: string;
  uom_name?: string;
  qty_ordered: number;
  qty_received?: number;
  unit_price: number;
  subtotal?: number;
  product_supplier_id?: string;
  planning_id?: string;
  notes?: string;
}

export interface PurchaseOrderList {
  id: string;
  po_number: string;
  reference_no?: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  store_id: string;
  store_name: string;
  warehouse_id: string;
  warehouse_name: string;
  order_date: string;
  expected_delivery?: string;
  total_amount: number;
  status: string;
  approved_by_id?: string;
  approved_at?: string;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderDetail {
  id: string;
  po_number: string;
  reference_no?: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  supplier_address?: string;
  store_id: string;
  store_code: string;
  store_name: string;
  store_address?: string;
  warehouse_id: string;
  warehouse_name: string;
  order_date: string;
  expected_delivery?: string;
  payment_term_days: number;
  payment_mode: string;
  promo_marketing_discount_percentage: number;
  promo_marketing_discount_amount: number;
  total_amount: number;
  status: string;
  approved_by_id?: string;
  approved_at?: string;
  approved_by_name?: string;
  created_by_id: string;
  created_by_name: string;
  notes?: string;
  supplier_notes?: string;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderPayload {
  supplier_id: string;
  store_id: string;
  warehouse_id: string;
  reference_no?: string;
  order_date?: string;
  expected_delivery?: string;
  payment_term_days?: number;
  payment_mode?: string;
  notes?: string;
  supplier_notes?: string;
  items: {
    product_id: string;
    uom_id: string;
    qty_ordered: number;
    unit_price: number;
    product_supplier_id?: string;
    planning_id?: string;
    notes?: string;
  }[];
}

export interface UpdatePurchaseOrderPayload {
  reference_no?: string;
  expected_delivery?: string;
  payment_term_days?: number;
  payment_mode?: string;
  notes?: string;
  supplier_notes?: string;
  items: {
    product_id: string;
    uom_id: string;
    qty_ordered: number;
    unit_price: number;
    product_supplier_id?: string;
    planning_id?: string;
    notes?: string;
  }[];
}

export interface PurchaseOrderPlanning {
  id: string;
  store_id: string;
  product_id: string;
  product_supplier_id: string;
  product_sku: string;
  product_name: string;
  supplier_code: string;
  supplier_name: string;
  current_stock: number;
  safety_stock: number;
  dynamic_safety_stock: number;
  reorder_point: number;
  average_daily_sales: number;
  lead_time_days: number;
  lead_time_demand: number;
  status: string;
  recommended_order_qty: number;
  order_qty: number;
  is_manual_supplier: boolean;
  is_selected: boolean;
  calculated_date: string;
  processed_date?: string;
  processed_by_id?: string;
}

export interface ApprovePlanningPayload {
  product_ids: string[];
  order_quantities: number[];
  processed_by_id?: string;
}

export interface BulkCreatePOPayload {
  store_id: string;
  warehouse_id: string;
}
