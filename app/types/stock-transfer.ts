export interface StockTransferList {
  id: string;
  transfer_number: string;
  from_warehouse_id: string;
  from_warehouse_name?: string;
  to_warehouse_id: string;
  to_warehouse_name?: string;
  transfer_date: string;
  status: "DRAFT" | "SHIPPED" | "RECEIVED" | "CANCELLED";
  total_items?: number;
  created_at: string;
}

export interface StockTransferItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  uom_id: string;
  uom_code: string;
  qty_requested: number;
  qty_sent: number;
  qty_received?: number;
  notes?: string;
}

export interface StockTransferDetail {
  id: string;
  transfer_number: string;
  from_warehouse_id: string;
  from_warehouse_name?: string;
  to_warehouse_id: string;
  to_warehouse_name?: string;
  transfer_date: string;
  driver_name?: string;
  vehicle_number?: string;
  status: "DRAFT" | "SHIPPED" | "RECEIVED" | "CANCELLED";
  shipped_at?: string;
  received_at?: string;
  notes?: string;
  created_at: string;
  items: StockTransferItem[];
}

export interface StockTransferPlanning {
  id: string;
  plan_date: string;
  from_warehouse_id: string;
  from_warehouse_name?: string;
  to_warehouse_id: string;
  to_warehouse_name?: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  uom_id: string;
  uom_code: string;
  recommended_qty: number;
  approved_qty: number;
  status: "PENDING" | "APPROVED" | "IGNORED" | "REALIZED";
}
