<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Work Center (Pusat Kerja / Dapur)";
useHead({ title });

interface WorkCenterList {
  id: string;
  code: string;
  name: string;
  warehouse_id: string;
  warehouse_name?: string;
  is_active: boolean;
}

const columns: Column<WorkCenterList>[] = [
  {
    key: "code",
    label: "Kode",
    width: "20%",
  },
  {
    key: "name",
    label: "Nama Work Center",
  },
  {
    key: "warehouse_name",
    label: "Gudang / Cabang Terkait",
  },
  {
    key: "is_active",
    label: "Status",
    className: "text-center",
    width: "15%",
  },
];

const tableRef = ref();
const { loading: submitting, submitForm } = useForm2();

const showModal = ref(false);
const isEdit = ref(false);
const editingId = ref("");

const form = ref({
  code: "",
  name: "",
  warehouse_id: "",
  is_active: true,
});

const warehouses = ref<any[]>([]);

onMounted(async () => {
  const res = await useApi<{ data: any[] }>("/inventory/warehouses");
  if (res.data?.data) {
    warehouses.value = res.data.data;
  }
});

const openCreateModal = () => {
  isEdit.value = false;
  editingId.value = "";
  form.value = {
    code: "",
    name: "",
    warehouse_id: warehouses.value[0]?.id || "",
    is_active: true,
  };
  showModal.value = true;
};

const openEditModal = (row: any) => {
  isEdit.value = true;
  editingId.value = row.id;
  form.value = {
    code: row.code,
    name: row.name,
    warehouse_id: row.warehouse_id,
    is_active: row.is_active,
  };
  showModal.value = true;
};

const saveWorkCenter = async () => {
  if (!form.value.code || !form.value.name || !form.value.warehouse_id) {
    alert("Semua field wajib diisi.");
    return;
  }

  const url = isEdit.value
    ? `/inventory/work-centers/${editingId.value}`
    : "/inventory/work-centers";
  const method = isEdit.value ? "PUT" : "POST";

  const res = await submitForm(url, {
    method,
    body: form.value,
  });

  if (res?.success) {
    showModal.value = false;
    tableRef.value?.reload();
  }
};

const deleteWorkCenter = async (id: string) => {
  if (!confirm("Hapus Work Center ini?")) return;
  const res = await submitForm(`/inventory/work-centers/${id}`, { method: "DELETE" });
  if (res?.success) {
    tableRef.value?.reload();
  }
};

const options = {
  columns,
  ajax: {
    url: "/inventory/work-centers/pagination",
  },
  pathKey: "work-centers",
  showActions: true,
  actionWidth: "15%",
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:building-factory-2">
      <button
        type="button"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
        @click="openCreateModal"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Tambah Work Center
      </button>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-warehouse_name="{ row, value }">
          <span>{{ value || row.warehouse_id }}</span>
        </template>

        <template #cell-is_active="{ value }">
          <span :class="['badge', value ? 'bg-success text-white' : 'bg-secondary text-white']">
            {{ value ? 'Aktif' : 'Non-Aktif' }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <button
              type="button"
              class="btn btn-sm btn-outline-info py-1 px-2 rounded-1"
              @click="openEditModal(row)"
            >
              <Icon name="i-tabler:pencil" class="icon icon-2" />
              Edit
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger py-1 px-2 rounded-1"
              @click="deleteWorkCenter(row.id)"
            >
              <Icon name="i-tabler:trash" class="icon icon-2" />
              Hapus
            </button>
          </div>
        </template>
      </DataTable3>

      <!-- Modal Create / Edit -->
      <div
        v-if="showModal"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.6);"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isEdit ? 'Edit Work Center' : 'Tambah Work Center Baru' }}
              </h5>
              <button
                type="button"
                class="btn-close"
                @click="showModal = false"
              ></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label required">Gudang / Lokasi Induk</label>
                <select v-model="form.warehouse_id" class="form-select rounded-1" required>
                  <option value="">-- Pilih Gudang --</option>
                  <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                    {{ wh.name }} ({{ wh.code }})
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <ui-input2
                  v-model="form.code"
                  label="Kode Work Center"
                  placeholder="Contoh: WC-BUTCHERY, WC-BAKERY"
                  :required="true"
                />
              </div>
              <div class="mb-3">
                <ui-input2
                  v-model="form.name"
                  label="Nama Work Center"
                  placeholder="Contoh: Dapur Butchery Meat Cutting"
                  :required="true"
                />
              </div>
              <div class="mb-3">
                <label class="form-check form-switch mt-2">
                  <input
                    v-model="form.is_active"
                    class="form-check-input"
                    type="checkbox"
                  />
                  <span class="form-check-label">Status Aktif</span>
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary rounded-1"
                @click="showModal = false"
              >
                Batal
              </button>
              <button
                type="button"
                class="btn btn-primary rounded-1"
                :disabled="submitting"
                @click="saveWorkCenter"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  </div>
</template>
