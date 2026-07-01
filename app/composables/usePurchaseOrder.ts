import type {
  CreatePurchaseOrderPayload,
  PurchaseOrderDetail,
  PurchaseOrderList,
  UpdatePurchaseOrderPayload,
} from "~/types/purchase-order";

export function usePurchaseOrder() {
  const getPODetail = async (id: string) => {
    const res = await useApi<{ data: PurchaseOrderDetail }>(`/purchase-orders/${id}`);
    if (res.data?.data) {
      return res.data.data;
    }
    return null;
  };

  return {
    getPODetail,
  };
}
