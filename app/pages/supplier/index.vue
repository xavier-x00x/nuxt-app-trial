<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Supplier Management";
useHead({ title });

interface DataList {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ColumnConfig extends Column<DataList> {
  key: keyof DataList;
}

const columns: ColumnConfig[] = [
  {
    key: "code",
    label: "Code",
    width: "5%",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "contact_person",
    label: "Contact Person",
  },
  {
    key: "phone_number",
    label: "Phone",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "is_active",
    label: "Active",
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
  await submitForm(`/suppliers/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const selectedSupplier = ref<DataList | null>(null);
const loading = ref(false);
const detailModalEl = ref<HTMLElement | null>(null);
const detailModal = ref<any>(null);

const showDetail = async (row: DataList) => {
  selectedSupplier.value = row;
  loading.value = true;

  if (import.meta.client) {
    const bootstrap = (window as any).bootstrap;
    if (bootstrap && detailModalEl.value && !detailModal.value) {
      detailModal.value = new bootstrap.Modal(detailModalEl.value);
    }
  }

  detailModal.value?.show();

  const { data, error } = await useApi<{ data: DataList }>(`/suppliers/${row.id}`);
  if (!error && data?.data) {
    selectedSupplier.value = data.data;
  }
  loading.value = false;
};

const options = {
  columns,
  ajax: {
    url: `/suppliers/pagination`,
  },
  pathKey: "suppliers",
  showActions: true,
  actionWidth: "8%",
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:truck" />
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-success text-white' : 'bg-danger text-white']">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #cell-updated_at="{ value }">
          <!-- cek jika value nya mengandung "0001-01-01" atau tidak, jika iya maka tampilkan "-" jika tidak maka tampilkan format date nya -->
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/supplier/${row.id}`"
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
              <Icon name="i-tabler:truck" class="icon me-2 text-primary icon-2" />
              Supplier Detail
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="loading && !selectedSupplier" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <div class="mt-2 text-secondary">Loading...</div>
            </div>
            <div v-else-if="selectedSupplier" class="row g-3">
              <!-- Left Column: Details Table -->
              <div class="col-md-8 col-sm-12">
                <table class="table table-borderless table-sm mb-0">
                  <tbody>
                    <tr>
                      <td class="fw-bold text-muted" style="width: 180px">Code</td>
                      <td>{{ selectedSupplier.code }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Name</td>
                      <td>{{ selectedSupplier.name }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Contact Person</td>
                      <td>{{ selectedSupplier.contact_person || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Phone Number</td>
                      <td>{{ selectedSupplier.phone_number || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Email</td>
                      <td>{{ selectedSupplier.email || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Address</td>
                      <td>{{ selectedSupplier.address || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Active</td>
                      <td>
                        <span :class="selectedSupplier.is_active ? 'text-success' : 'text-danger'">
                          {{ selectedSupplier.is_active ? 'Yes' : 'No' }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Created At</td>
                      <td>{{ formatDate(selectedSupplier.created_at) }}</td>
                    </tr>
                    <tr>
                      <td class="fw-bold text-muted">Updated At</td>
                      <td>{{ formatDate(selectedSupplier.updated_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Right Column: Supplier Logo Skeleton -->
              <div class="col-md-4 col-sm-12 d-flex flex-column align-items-center justify-content-center">
                <div class="supplier-logo-skeleton w-100 d-flex flex-column align-items-center justify-content-center border border-dashed rounded bg-light text-muted p-4" style="aspect-ratio: 1; min-height: 200px;">
                  <Icon name="i-tabler:truck" class="icon icon-lg mb-2 text-secondary" style="font-size: 3rem;" />
                  <span class="fs-6 fw-medium text-secondary">Supplier Logo</span>
                  <span class="text-muted small">Placeholder</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary btn-close-custom rounded-1" data-bs-dismiss="modal">
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
