<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const { openConfirmDelete } = useConfirmDelete();
const title = "Manajemen Pengguna (User)";
useHead({ title });

interface DataList {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  store_id?: string;
  store_name?: string;
  role: string;
  is_active: boolean;
  updated_at: string;
}

const columns: Column<DataList>[] = [
  {
    key: "name",
    label: "Nama & Username",
  },
  {
    key: "email",
    label: "Email & Kontak",
  },
  {
    key: "role",
    label: "Role / Jabatan",
    className: "text-center",
  },
  {
    key: "is_active",
    label: "Status",
    className: "text-center",
  },
  {
    key: "updated_at",
    label: "Terakhir Diubah",
    className: "text-center",
  },
];

const tableRef = ref();
const { success, submitForm } = useForm2();

const deleteItem = async (id: string) => {
  await submitForm(`/users/${id}`, {
    method: "DELETE",
  });
  if (success.value) tableRef.value?.removeRow(id);
};

const options = {
  columns,
  ajax: {
    url: `/users/pagination`,
  },
  pathKey: "users",
  showActions: true,
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:users">
      <NuxtLink
        to="/user/new"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Tambah Pengguna
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <DataTable3 ref="tableRef" :options="options">
        <template #cell-name="{ row }">
          <div class="d-flex align-items-center">
            <span class="avatar avatar-sm bg-blue-lt me-2 rounded-circle">
              {{ (row.name || 'U').charAt(0).toUpperCase() }}
            </span>
            <div>
              <div class="fw-bold">{{ row.name }}</div>
              <div class="text-muted small">@{{ row.username }}</div>
            </div>
          </div>
        </template>

        <template #cell-email="{ row }">
          <div>
            <div>{{ row.email }}</div>
            <div v-if="row.phone" class="text-muted small">
              <Icon name="i-tabler:phone" class="icon icon-sm me-1" />
              {{ row.phone }}
            </div>
          </div>
        </template>

        <template #cell-role="{ value }">
          <span
            v-if="value"
            class="badge bg-primary-lt text-nowrap text-uppercase"
          >
            {{ value }}
          </span>
          <span v-else class="text-muted small">-</span>
        </template>

        <template #cell-is_active="{ value }">
          <span v-if="value === false" class="badge bg-danger-lt">
            Nonaktif
          </span>
          <span v-else class="badge bg-success-lt">
            Aktif
          </span>
        </template>

        <template #cell-updated_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <NuxtLink
            :to="`/user/${row.id}`"
            class="btn btn-sm py-1 px-2 me-2 rounded-1 text-nowrap"
          >
            <Icon name="i-tabler:edit" class="icon icon-2" />
            Edit
          </NuxtLink>
          <a
            href="#"
            class="btn btn-sm py-1 px-2 rounded-1 text-nowrap text-danger"
            @click.prevent="openConfirmDelete(row.id, deleteItem)"
          >
            <Icon name="i-tabler:trash" class="icon icon-2" />
            Hapus
          </a>
        </template>
      </DataTable3>
    </PageBody>
    <ui-confirm-delete-modal />
  </div>
</template>
