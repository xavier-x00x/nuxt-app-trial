<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const isNew = computed(() => id.value === "new");
const title = computed(() => isNew.value ? "Create Role" : "Edit Role");
useHead({ title });

interface Permission {
  id: string;
  path: string;
  name: string;
}

interface RoleForm {
  name: string;
  permission_ids: string[];
}

const dataForm = ref<RoleForm>({
  name: "",
  permission_ids: [],
});

if (!isNew.value) {
  const { data: roleResponse, error } = await useApiFetch<any>(`/roles/${id.value}`);
  if (error.value || !roleResponse.value?.data) {
    setFlash("Data role tidak ditemukan", "error");
    navigateTo("/role");
  } else {
    const role = roleResponse.value.data;
    dataForm.value.name = role.name || "";
    if (Array.isArray(role.permissions)) {
      dataForm.value.permission_ids = role.permissions.map((p: any) => p.id || p);
    } else if (Array.isArray(role.permission_ids)) {
      dataForm.value.permission_ids = role.permission_ids;
    }
  }
}

const form = ref<HTMLFormElement>();
const permissionList = ref<Permission[]>([]);
const { data: permissionRes, error: permissionError } = await useApiFetch<any>('/permissions');

if (permissionError.value) {
  console.error('Failed to load permissions', permissionError.value);
} else if (permissionRes.value?.data) {
  permissionList.value = permissionRes.value.data;
}

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};

  for (const item of permissionList.value) {
    let groupKey = "Lainnya";
    if (item.path.includes(".")) {
      groupKey = item.path.split(".")[0] || "Lainnya";
    } else if (item.path.includes(":")) {
      groupKey = item.path.split(":")[0] || "Lainnya";
    }
    (groups[groupKey] ??= []).push(item);
  }

  return groups;
});

const toggleGroup = (groupItems: Permission[]) => {
  const allSelected = groupItems.every((item) => dataForm.value.permission_ids.includes(item.id));
  if (allSelected) {
    const itemIds = new Set(groupItems.map((i) => i.id));
    dataForm.value.permission_ids = dataForm.value.permission_ids.filter((id) => !itemIds.has(id));
  } else {
    const newSet = new Set([...dataForm.value.permission_ids, ...groupItems.map((i) => i.id)]);
    dataForm.value.permission_ids = Array.from(newSet);
  }
};

const isGroupAllSelected = (groupItems: Permission[]) => {
  return groupItems.length > 0 && groupItems.every((item) => dataForm.value.permission_ids.includes(item.id));
};

const { loading, success, errors, formatError, submitForm } = useForm2();
const submitUrl = computed(() => isNew.value ? "/roles" : `/roles/${id.value}`);
const submitMethod = computed(() => isNew.value ? "POST" : "PUT");

const onSubmit = async () => {
  const payload = {
    name: dataForm.value.name?.trim(),
    permission_ids: dataForm.value.permission_ids,
  };

  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: payload,
  });

  if (success.value) {
    setFlash(`Role berhasil ${isNew.value ? 'dibuat' : 'diperbarui'}`, "success");
    navigateTo("/role");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:adjustments-horizontal">
      <ui-button-back to="/role" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-10 col-md-11 col-sm-12">
            <div class="card mb-3">
              <div class="card-body">
                <ui-input2
                  v-model="dataForm.name"
                  label="Nama Role *"
                  type="text"
                  placeholder="Contoh: SUPER_ADMIN, CASHIER, PURCHASING"
                  :error="formatError('Nama Role', 'name')"
                />
              </div>
            </div>

            <div class="mb-3 mt-4">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label fs-4 fw-bold mb-0">Granular Permissions ({{ dataForm.permission_ids.length }} dipilih)</label>
              </div>

              <div v-if="permissionList.length === 0" class="text-muted text-center py-4">
                Tidak ada data permission tersedia di database.
              </div>
              <div v-else>
                <template v-for="(group, key) in groupedPermissions" :key="key">
                  <div class="card mb-3 shadow-none border">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
                      <span class="text-uppercase fw-bold text-primary">{{ key }}</span>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary py-0 px-2"
                        @click="toggleGroup(group)"
                      >
                        {{ isGroupAllSelected(group) ? 'Batal Pilih Semua' : 'Pilih Semua' }}
                      </button>
                    </div>
                    <div class="card-body">
                      <div class="row g-2">
                        <label
                          v-for="row in group"
                          :key="row.id"
                          class="col-xl-4 col-md-6 col-sm-12"
                        >
                          <input
                            v-model="dataForm.permission_ids"
                            type="checkbox"
                            :value="row.id"
                            class="form-selectgroup-input"
                          >
                          <div class="form-selectgroup-label d-flex align-items-center rounded-1 p-2">
                            <div class="me-2"><span class="form-selectgroup-check rounded-1" /></div>
                            <div class="form-selectgroup-label-content text-start">
                              <div class="font-weight-medium small">{{ row.name }}</div>
                              <div class="text-muted extra-small font-monospace text-truncate" style="font-size: 0.75rem;">{{ row.path }}</div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
