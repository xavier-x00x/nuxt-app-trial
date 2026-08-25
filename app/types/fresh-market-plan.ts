export interface FreshMarketPlanList {
  id: string;
  plan_number: string;
  plan_date: string;
  source_location: string;
  target_warehouse_name: string;
  buyer_name: string;
  total_estimated_budget: number;
  cash_advance_amount: number;
  total_actual_spend?: number;
  status: "DRAFT" | "APPROVED" | "REALIZED" | "CANCELLED";
  created_at: string;
}

export interface FreshMarketPlanItem {
  id?: string;
  product_id: string;
  product_code: string;
  product_name: string;
  uom_id: string;
  uom_code: string;
  target_qty: number;
  estimated_price: number;
  estimated_subtotal?: number;
  shrinkage_buffer_pct?: number;
  actual_qty?: number;
  actual_price?: number;
  actual_subtotal?: number;
  vendor_name?: string;
  notes?: string;
}

export interface FreshMarketPlanDetail {
  id: string;
  plan_number: string;
  plan_date: string;
  source_location: string;
  target_warehouse_id: string;
  target_warehouse_name: string;
  buyer_user_id?: string;
  buyer_name: string;
  total_estimated_budget: number;
  approved_budget?: number;
  cash_advance_amount: number;
  total_actual_spend?: number;
  cash_balance?: number;
  status: "DRAFT" | "APPROVED" | "REALIZED" | "CANCELLED";
  approved_at?: string;
  approved_by_name?: string;
  realized_at?: string;
  realized_by_name?: string;
  receipt_number?: string;
  notes?: string;
  created_at: string;
  items: FreshMarketPlanItem[];
}
