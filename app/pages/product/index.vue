<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Product Management";
useHead({ title });

interface DataList {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category_id: string;
  category: { name: string } | null;
  base_uom_id: string;
  base_uom: { name: string } | null;
  is_stockable: boolean;
  length: number;
  width: number;
  height: number;
  weight: number;
  is_stackable: boolean;
  max_stack_layer: number;
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
const loading = ref(false);
const detailModalEl = ref<HTMLElement | null>(null);
const detailModal = ref<any>(null);

const showDetail = async (row: DataList) => {
  selectedProduct.value = row;
  loading.value = true;

  if (import.meta.client) {
    const bootstrap = (window as any).bootstrap;
    if (bootstrap && detailModalEl.value && !detailModal.value) {
      detailModal.value = new bootstrap.Modal(detailModalEl.value);
    }
  }

  detailModal.value?.show();

  const { data, error } = await useApi<{ data: DataList }>(`/products/${row.id}`);
  if (!error && data?.data) {
    selectedProduct.value = data.data;
  }
  loading.value = false;
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
        <template #cell-category_id="{ row }">
          {{ row.category?.name || '-' }}
        </template>
        <template #cell-base_uom_id="{ row }">
          {{ row.base_uom?.name || '-' }}
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
      <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
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
          <div class="modal-body">
            <div v-if="loading && !selectedProduct" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-2 text-secondary">Loading...</div>
            </div>
            <div v-else-if="selectedProduct" class="row g-3">
              <!-- Left Column: Details Table -->
              <div class="col-md-8 col-sm-12">
                <table class="table table-borderless table-sm mb-0">
                  <tbody>
                    <tr>
                      <td class="fw-bold text-muted" style="width: 180px">SKU</td>
                      <td>{{ selectedProduct.sku }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Barcode</td>
                      <td>{{ selectedProduct.barcode || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Name</td>
                      <td>{{ selectedProduct.name }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Category</td>
                      <td>{{ selectedProduct.category?.name || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Base UOM</td>
                      <td>{{ selectedProduct.base_uom?.name || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Stockable</td>
                      <td>
                        <span :class="selectedProduct.is_stockable ? 'text-success' : 'text-danger'">
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
                        <span :class="selectedProduct.is_stackable ? 'text-success' : 'text-danger'">
                          {{ selectedProduct.is_stackable ? 'Yes' : 'No' }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Max Stack Layer</td>
                      <td>{{ selectedProduct.max_stack_layer }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Created At</td>
                      <td>{{ formatDate(selectedProduct.created_at) }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Updated At</td>
                      <td>{{ formatDate(selectedProduct.updated_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Right Column: Product Photo Skeleton -->
              <div class="col-md-4 col-sm-12 d-flex flex-column align-items-center justify-content-center">
                <div class="product-image-skeleton w-100 d-flex flex-column align-items-center justify-content-center border border-dashed rounded bg-light text-muted p-4" style="aspect-ratio: 1; min-height: 200px;">
                  <Icon name="i-tabler:photo" class="icon icon-lg mb-2 text-secondary" style="font-size: 3rem;" />
                  <span class="fs-6 fw-medium text-secondary">Product Photo</span>
                  <span class="text-muted small">Placeholder</span>
                </div>
              </div>
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
