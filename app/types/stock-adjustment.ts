export interface StockAdjustmentList {
  id: string;
  adjustment_number: string;
  warehouse_id: string;
  warehouse_name?: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  notes?: string;
  created_at: string;
}

export interface StockAdjustmentItem {
  id?: string;
  product_id: string;
  product_code: string;
  product_name: string;
  uom_name: string;
  adjustment_type: "INCREASE" | "DECREASE";
  quantity: number;
  cost_price?: number;
  reason: string;
  notes?: string;
}

export interface StockAdjustmentDetail {
  id: string;
  adjustment_number: string;
  warehouse_id: string;
  warehouse_name?: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  requested_by_id?: string;
  approved_by_id?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  items: StockAdjustmentItem[];
}
