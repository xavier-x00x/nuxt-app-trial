import type { GoodsReceiptDetail } from "~/types/goods-receipt";

export function useGoodsReceipt() {
  const getGRDetail = async (id: string) => {
    const res = await useApi<{ data: GoodsReceiptDetail }>(`/goods-receipts/${id}`);
    if (res.data?.data) {
      return res.data.data;
    }
    return null;
  };

  return {
    getGRDetail,
  };
}
