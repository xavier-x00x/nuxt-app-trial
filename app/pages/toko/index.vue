<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { setFlash } = useFlash();
const { openConfirmDelete } = useConfirmDelete();
const config = useRuntimeConfig();
const title = "Toko Management";
useHead({ title });

interface DataList {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: string;
  updated_at: string;
}

const columns: Column<DataList>[] = [
  {
    key: "code",
    label: "Code",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "address",
    label: "Address",
  },
  {
    key: "phone",
    label: "Phone",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "is_active",
    label: "Status",
    className: "text-center",
  },
  {
    key: "updated_at",
    label: "updated at",
    className: "text-center",
  },
];

const load_data = ref(false);
const tableRef = ref(); // table ref catatan: ref dikosongkan untuk element
const { success, submitForm } = useForm();

const deleteItem = async (id: number) => {
  try {
    await submitForm(`${config.public.apiUrl}/stores/${id}`, {
      method: "DELETE",
    });
    console.log("Data berhasil dihapus:", id);
    // update data list
    tableRef.value?.removeRow(id); // update data list;
    setFlash("Data berhasil dihapus", "success");
  } catch (err) {
    console.error("Gagal hapus:", err);
  }
};

const options = {
  columns,
  ajax: {
    url: `${config.public.apiUrl}/stores/pagination`,
  },
  pathKey: "stores",
  showActions: true,
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <NuxtLink
        to="/toko/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Create New
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <!-- custom cell qty -->
        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>
        <template #cell-status="{ value }">
          <span :class="['badge', value ? 'bg-success text-white' : 'bg-danger text-white']">
            {{ value ? 'Active' : 'Inactive' }}
          </span>
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/toko/${row.id}`"
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
  </div>
</template>
