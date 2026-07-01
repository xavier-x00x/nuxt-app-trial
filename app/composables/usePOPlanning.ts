import type {
  ApprovePlanningPayload,
  PurchaseOrderPlanning,
} from "~/types/purchase-order";

export function usePOPlanning() {
  const getPendingPlannings = async (storeId: string) => {
    const res = await useApi<{ data: PurchaseOrderPlanning[] }>(`/planning/pending?store_id=${storeId}`);
    if (res.data?.data) {
      return res.data.data;
    }
    return [];
  };

  const getPlanningDetail = async (id: string) => {
    const res = await useApi<{ data: PurchaseOrderPlanning }>(`/planning/${id}`);
    if (res.data?.data) {
      return res.data.data;
    }
    return null;
  };

  return {
    getPendingPlannings,
    getPlanningDetail,
  };
}
