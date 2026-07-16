<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const authStore = useAuthStore();
const { openConfirmDelete } = useConfirmDelete();
const title = "Product Management";
useHead({ title });

interface DataList {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  variant: string | null;
  category_id: string;
  category_name: string | null;
  base_uom_id: string;
  uom_name: string | null;
  is_stockable: boolean;
  length: number;
  width: number;
  height: number;
  weight: number;
  is_stackable: boolean;
  max_stack_layer: number;
  is_taxable: boolean;
  tax_id: string;
  tax_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ColumnConfig extends Column<DataList> {
  key: keyof DataList;
}

const columns: ColumnConfig[] = [
  {
    key: "sku",
    label: "SKU",
  },
  {
    key: "barcode",
    label: "Barcode",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "category_id",
    label: "Category",
  },
  {
    key: "base_uom_id",
    label: "UOM",
  },
  {
    key: "is_stockable",
    label: "Stockable",
    className: "text-center",
  },
  {
    key: "is_stackable",
    label: "Stackable",
    className: "text-center",
  },
  {
    key: "updated_at",
    label: "Updated At",
    className: "text-center",
  },
];

const tableRef = ref();
const { success, submitForm } = useForm2();

const deleteItem = async (id: string) => {
  await submitForm(`/products/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const selectedProduct = ref<DataList | null>(null);
const productUoms = ref<any[]>([]);
const productSuppliers = ref<any[]>([]);
const sellPriceForStore = ref<number | null>(null);
const loading = ref(false);
const detailModalEl = ref<HTMLElement | null>(null);
const detailModal = ref<any>(null);

const showDetail = async (row: DataList) => {
  selectedProduct.value = row;
  productUoms.value = [];
  productSuppliers.value = [];
  loading.value = true;

  if (import.meta.client) {
    const bootstrap = (window as any).bootstrap;
    if (bootstrap && detailModalEl.value && !detailModal.value) {
      detailModal.value = new bootstrap.Modal(detailModalEl.value);
    }
  }

  detailModal.value?.show();

  const [resProduct, resUoms, resSuppliers, resPrices] = await Promise.all([
    useApi<{ data: DataList }>(`/products/${row.id}`),
    useApi<{ data: any[] }>(`/product-uoms/product/${row.id}`),
    useApi<{ data: any[] }>(`/products/${row.id}/suppliers`),
    useApi<{ data: any[] }>(`/product-prices/product/${row.id}`)
  ]);

  if (!resProduct.error && resProduct.data?.data) {
    // Merge so we don't lose properties like uom_name and category_name that came from row
    selectedProduct.value = { ...row, ...resProduct.data.data };
  }
  if (!resUoms.error && resUoms.data?.data) {
    productUoms.value = resUoms.data.data;
  }
  if (!resSuppliers.error && resSuppliers.data?.data) {
    productSuppliers.value = resSuppliers.data.data;
  }
  
  sellPriceForStore.value = null;
  if (!resPrices.error && resPrices.data?.data && authStore.user?.store_id) {
    const storePrice = resPrices.data.data.find(
      (p) => p.price_list && p.price_list.store_id === authStore.user?.store_id
    );
    if (storePrice) {
      sellPriceForStore.value = storePrice.sell_price;
    }
  }

  loading.value = false;
};

const formatCurrency = (value: number | string) => {
  if (!value) return "Rp 0";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

const options = {
  columns,
  ajax: {
    url: `/products/pagination`,
  },
  pathKey: "products",
  showActions: true,
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package" />
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-name="{ row }">
          {{ row.name + " " + (row.variant || '') }}
        </template>
        <template #cell-category_id="{ row }">
          {{ row.category_name || '-' }}
        </template>
        <template #cell-base_uom_id="{ row }">
          {{ row.uom_name || '-' }}
        </template>
        <template #cell-is_stockable="{ value }">
          <span :class="value ? 'text-success' : 'text-danger'">
            {{ value ? 'Yes' : 'No' }}
          </span>
        </template>
        <template #cell-is_stackable="{ value }">
          <span :class="value ? 'text-success' : 'text-danger'">
            {{ value ? 'Yes' : 'No' }}
          </span>
        </template>
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/product/${row.id}`"
            class="btn btn-sm py-1 px-2 me-2 rounded-1 text-nowrap"
          >
            <Icon name="i-tabler:report" class="icon icon-2" />
            Report
          </NuxtLink>
          <button
            type="button"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap me-1"
            @click="showDetail(row)"
          >
            <Icon name="i-tabler:eye" class="icon icon-2" />
            View
          </button>
          <a
            href="#"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap"
            @click.prevent="openConfirmDelete(row.id, deleteItem)"
          >
            <Icon name="i-tabler:trash" class="icon icon-2" />
            Delete
          </a>
        </template>
      </DataTable3>
    </PageBody>
    <ui-confirm-delete-modal />

    <!-- Detail Modal -->
    <div ref="detailModalEl" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
        <div class="modal-content rounded-1">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center">
              <Icon name="i-tabler:package" class="icon me-2 text-primary icon-2" />
              Product Detail
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body p-0">
            <div v-if="loading && !selectedProduct" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-2 text-secondary">Loading...</div>
            </div>
            <div v-else-if="selectedProduct" class="p-4">
              <div class="row g-4">
                <!-- Left Column: Details Table -->
                <div class="col-md-8 col-sm-12">
                  <h5 class="fw-bold text-muted border-bottom pb-2 mb-3">Informasi Umum</h5>
                  <div class="table-responsive border rounded-1">
                    <table class="table table-vcenter card-table mb-0 table-sm">
                      <tbody>
                        <tr>
                          <td class="fw-bold text-muted" style="width: 30%">SKU</td>
                          <td>{{ selectedProduct.sku }}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Barcode</td>
                          <td>{{ selectedProduct.barcode || '-' }}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Name</td>
                          <td class="fw-bold">{{ selectedProduct.name }}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Category</td>
                          <td>{{ selectedProduct.category_name || '-' }}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Base UOM</td>
                          <td><span class="badge bg-blue-lt">{{ selectedProduct.uom_name || '-' }}</span></td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Sell Price</td>
                          <td>
                            <span v-if="sellPriceForStore !== null" class="fw-bold text-success">{{ formatCurrency(sellPriceForStore) }}</span>
                            <span v-else class="text-muted italic">-</span>
                          </td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Stockable</td>
                          <td>
                            <span :class="selectedProduct.is_stockable ? 'badge bg-success-lt text-success' : 'badge bg-danger-lt text-danger'">
                              {{ selectedProduct.is_stockable ? 'Yes' : 'No' }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Dimensions (L x W x H)</td>
                          <td>{{ selectedProduct.length }} x {{ selectedProduct.width }} x {{ selectedProduct.height }}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Weight</td>
                          <td>{{ selectedProduct.weight }}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Stackable</td>
                          <td>
                            <span :class="selectedProduct.is_stackable ? 'badge bg-success-lt text-success' : 'badge bg-danger-lt text-danger'">
                              {{ selectedProduct.is_stackable ? 'Yes' : 'No' }}
                            </span>
                            <span v-if="selectedProduct.is_stackable" class="text-muted ms-2 small">(Max: {{ selectedProduct.max_stack_layer }})</span>
                          </td>
                        </tr>
                        <tr>
                          <td class="fw-bold text-muted">Taxable</td>
                          <td>
                            <span :class="selectedProduct.is_taxable ? 'badge bg-success-lt text-success' : 'badge bg-danger-lt text-danger'">
                              {{ selectedProduct.is_taxable ? 'Yes' : 'No' }}
                            </span>
                            <span v-if="selectedProduct.is_taxable && selectedProduct.tax_name" class="badge bg-purple-lt ms-2">
                              {{ selectedProduct.tax_name }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Right Column: Product Photo Skeleton -->
                <div class="col-md-4 col-sm-12">
                  <h5 class="fw-bold text-muted border-bottom pb-2 mb-3">Foto Produk</h5>
                  <div class="product-image-skeleton w-100 d-flex flex-column align-items-center justify-content-center border border-dashed rounded text-muted p-4 h-100" style="aspect-ratio: 1; min-height: 200px; max-height: 250px;">
                    <Icon name="i-tabler:photo" class="icon icon-lg mb-2 text-secondary" style="font-size: 3rem;" />
                    <span class="small">No Photo Available</span>
                  </div>
                </div>
              </div>

              <!-- Bottom Section: UOM Conversions -->
              <div class="row mt-4">
                <div class="col-12">
                  <h5 class="fw-bold text-muted border-bottom pb-2 mb-3">Konversi Satuan (UOM)</h5>
                  <div class="table-responsive border rounded-1">
                    <table class="table table-vcenter card-table mb-0 table-sm">
                      <thead>
                        <tr>
                          <th>Satuan (UOM)</th>
                          <th>Konversi ke Base</th>
                          <th>Barcode</th>
                          <th>Dimensi (P x L x T)</th>
                          <th>Berat</th>
                          <th class="text-center">Stackable</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="loading && productUoms.length === 0">
                          <td colspan="6" class="text-center text-muted py-3">
                            <span class="spinner-border spinner-border-sm me-2" role="status"></span> Loading UOMs...
                          </td>
                        </tr>
                        <tr v-else-if="productUoms.length === 0">
                          <td colspan="6" class="text-center text-muted py-4">
                            <Icon name="i-tabler:info-circle" class="me-1" /> Tidak ada konversi satuan untuk produk ini.
                          </td>
                        </tr>
                        <tr v-for="uom in productUoms" :key="uom.id">
                          <td class="fw-bold text-primary">{{ uom.uom?.name || uom.uom_id }}</td>
                          <td><span class="badge bg-secondary-lt">1 {{ uom.uom?.name }} = {{ uom.conversion_rate }} {{ selectedProduct.uom_name }}</span></td>
                          <td>{{ uom.barcode || '-' }}</td>
                          <td>{{ uom.length }} x {{ uom.width }} x {{ uom.height }}</td>
                          <td>{{ uom.weight }}</td>
                          <td class="text-center">
                            <span :class="uom.is_stackable ? 'badge bg-success-lt text-success' : 'badge bg-danger-lt text-danger'">
                              {{ uom.is_stackable ? 'Yes' : 'No' }}
                            </span>
                            <div v-if="uom.is_stackable" class="text-muted small mt-1">Max: {{ uom.max_stack_layer }}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>              <!-- Bottom Section: Suppliers -->
              <div class="row mt-4">
                <div class="col-12">
                  <h5 class="fw-bold text-muted border-bottom pb-2 mb-3">Informasi Supplier</h5>
                  <div class="table-responsive border rounded-1">
                    <table class="table table-vcenter card-table mb-0 table-sm">
                      <thead>
                        <tr>
                          <th>Supplier</th>
                          <th>Toko / Cabang</th>
                          <th>Supplier SKU</th>
                          <th>Satuan Order</th>
                          <th>Lead Time</th>
                          <th>Harga (Offered)</th>
                          <th>MOQ</th>
                          <th class="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="loading && productSuppliers.length === 0">
                          <td colspan="7" class="text-center text-muted py-3">
                            <span class="spinner-border spinner-border-sm me-2" role="status"></span> Loading Suppliers...
                          </td>
                        </tr>
                        <tr v-else-if="productSuppliers.length === 0">
                          <td colspan="7" class="text-center text-muted py-4">
                            <Icon name="i-tabler:info-circle" class="me-1" /> Tidak ada informasi supplier untuk produk ini.
                          </td>
                        </tr>
                        <tr v-for="supplier in productSuppliers" :key="supplier.id">
                          <td class="fw-bold">
                            <span v-if="supplier.supplier?.code" class="text-muted fw-normal">[ {{ supplier.supplier.code }} ]</span> 
                            {{ supplier.supplier?.name || '-' }}
                          </td>
                          <td>{{ supplier.store?.name || 'Nasional' }}</td>
                          <td>{{ supplier.supplier_sku || '-' }}</td>
                          <td>
                            <span v-if="supplier.purchase_uom" class="badge bg-purple-lt">{{ supplier.purchase_uom.name }}</span>
                            <span v-else class="text-muted small italic">Ikut Base UOM</span>
                          </td>
                          <td>{{ supplier.default_lead_time_days }} hari</td>
                          <td>{{ formatCurrency(supplier.offered_price) }}</td>
                          <td>{{ supplier.min_order_qty }}</td>
                          <td class="text-center">
                            <span v-if="supplier.is_primary" class="badge bg-blue-lt mb-1 d-block">Utama</span>
                            <span v-if="supplier.is_consignment" class="badge bg-purple-lt mb-1 d-block">Konsinyasi</span>
                            <span v-if="supplier.is_returnable" class="badge bg-teal-lt d-block">Bisa Retur</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-5 text-muted">
              Data not found.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-close-custom rounded-1" data-bs-dismiss="modal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-close-custom {
  --tblr-btn-padding-y: 0.3125rem;
  --tblr-btn-padding-x: 0.5rem;
  --tblr-btn-font-size: 0.75rem;
  --tblr-btn-border-radius: var(--tblr-border-radius-sm);
}
</style>
