<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Account Management";
useHead({ title });

interface DataList {
  id: string;
  account_code: string;
  name: string;
  account_type: string;
  normal_balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const columns: Column<DataList>[] = [
  {
    key: "account_code",
    label: "Code",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "account_type",
    label: "Type",
  },
  {
    key: "normal_balance",
    label: "Normal Balance",
  },
  {
    key: "is_active",
    label: "Status",
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
const { setFlash } = useFlash();
const config = useRuntimeConfig();

const deleteItem = async (id: string) => {
  await submitForm(`/accounts/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/accounts/pagination`,
  },
  pathKey: "accounts",
  showActions: true,
};

// ---- Import COA ----
const importModalEl = ref<HTMLElement | null>(null);
const importModal = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const importLoading = ref(false);
const importError = ref<string>("");

const openImportModal = () => {
  if (import.meta.client) {
    const bootstrap = (window as any).bootstrap;
    if (bootstrap && importModalEl.value && !importModal.value) {
      importModal.value = new bootstrap.Modal(importModalEl.value);
    }
  }
  resetImport();
  importModal.value?.show();
};

const resetImport = () => {
  selectedFile.value = null;
  importError.value = "";
  if (fileInput.value) fileInput.value.value = "";
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  importError.value = "";
  if (file) {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const isExt = /\.(xlsx|xls)$/i.test(file.name);
    if (!allowed.includes(file.type) && !isExt) {
      importError.value = "File harus berformat .xlsx atau .xls";
      target.value = "";
      selectedFile.value = null;
      return;
    }
  }
  selectedFile.value = file;
};

const submitImport = async () => {
  if (!selectedFile.value) {
    importError.value = "Silakan pilih file Excel terlebih dahulu";
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile.value);

  importLoading.value = true;
  await submitForm(`/accounts/import`, {
    method: "POST",
    body: formData,
  });
  importLoading.value = false;

  if (success.value) {
    importModal.value?.hide();
    resetImport();
    tableRef.value?.reload?.();
  }
};

const downloadTemplate = async () => {
  try {
    const auth = useAuthStore();
    const token = auth.accessToken;
    const baseURL = config.public.apiUrl;
    const res = await fetch(`${baseURL}/accounts/import/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Gagal mengunduh template");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-coa.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err: any) {
    setFlash(err?.message || "Gagal mengunduh template", "error");
  }
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:book">
      <button
        type="button"
        class="btn btn-outline-success rounded-1 d-none d-sm-inline-block me-2"
        @click="openImportModal"
      >
        <Icon name="i-tabler:file-spreadsheet" class="icon icon-2 me-0" />
        Import COA
      </button>
      <NuxtLink
        to="/account/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>
        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-success text-white' : 'bg-danger text-white']">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/account/${row.id}`"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap me-1"
          >
            <Icon name="i-tabler:pencil" class="icon icon-2" />
            Edit
          </NuxtLink>
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

    <!-- Import COA Modal -->
    <div ref="importModalEl" class="modal fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content rounded-1">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center">
              <Icon name="i-tabler:file-spreadsheet" class="icon me-2 text-success icon-2" />
              Import Chart of Accounts
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info d-flex align-items-start" role="alert">
              <Icon name="i-tabler:info-circle" class="icon icon-2 me-2 mt-1 flex-shrink-0" />
              <div class="small">
                Pastikan file mengikuti format template. Unduh template Excel
                terlebih dahulu jika belum punya.
              </div>
            </div>

            <div class="mb-3">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm rounded-1"
                @click="downloadTemplate"
              >
                <Icon name="i-tabler:download" class="icon icon-2 me-1" />
                Download Template Excel
              </button>
            </div>

            <div class="mb-2">
              <label class="form-label">File Excel (.xlsx / .xls)</label>
              <input
                ref="fileInput"
                type="file"
                class="form-control"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                @change="onFileChange"
              />
              <div v-if="selectedFile" class="form-text text-success mt-1">
                <Icon name="i-tabler:check" class="icon icon-2 me-1" />
                {{ selectedFile.name }}
              </div>
              <div v-if="importError" class="text-danger small mt-1">
                {{ importError }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary rounded-1"
              data-bs-dismiss="modal"
              :disabled="importLoading"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary rounded-1"
              :disabled="importLoading || !selectedFile"
              @click="submitImport"
            >
              <span
                v-if="importLoading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
              ></span>
              <Icon v-else name="i-tabler:upload" class="icon icon-2 me-1" />
              {{ importLoading ? 'Importing...' : 'Import' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
