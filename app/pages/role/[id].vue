<script setup lang="ts">
const route  = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Role" : "Edit Role");
useHead({ title });

interface Role {
  name: string;
  permissions: string[];
}

interface Permission {
  id: number;
  path: string;
  name: string;
}

interface RoleResponse {
  data: Role;
  message: string;
}

const dataForm = ref<Role>({
  name: "",
  permissions: []
});

if (id.value !== "new") {
  const { data: roleResponse, error } = await useApiFetch<RoleResponse>(`/roles/${id.value}`);
  if (error.value || !roleResponse.value) {
    setFlash("Data role tidak ditemukan", "error");
    navigateTo("/role");
  } else {
    // cek apakah ada permissions di data, bila tidak ada maka jadi array kosong
    if (!roleResponse.value.data.permissions) {
      roleResponse.value.data.permissions = [];
    }
    dataForm.value = roleResponse.value.data;
  }
}

const form = ref<HTMLFormElement>();
const permissionList = ref<Permission[]>([]);
const { data: permissionRes, error: permissionError } = await useApiFetch<{ data: Permission[] }>('/permissions');

if (permissionError.value) {
  console.error('Failed to load permissions', permissionError.value);
} else if (permissionRes.value) {
  permissionList.value = permissionRes.value.data;
  console.log(permissionList.value);
}

// Function untuk menfilter data permission dan Grouping berdasarkan path permission

const EXCLUDED_PATTERNS = ["index", "sign-in", "sign-up", "sign-out"] as const;
const HAS_DIGIT = /\d/;

const shouldExcludePermission = (name: string): boolean =>
  EXCLUDED_PATTERNS.some((p) => name.includes(p)) || HAS_DIGIT.test(name);

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};

  for (const item of permissionList.value) {
    if (shouldExcludePermission(item.path)) continue;

    const key = item.path.includes(":") ? item.path.split(":")[0] ?? "" : item.path;
    (groups[key] ??= []).push(item);
  }

  return groups;
});

const { loading, success, errors, formatError, submitForm } = useForm2();
const { url: submitUrl, method: submitMethod } = useResource("roles", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });
  if (success.value) navigateTo("/role");
};

</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <ui-button-back to="/role" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            {{ dataForm }}
            <ui-input
              v-model="dataForm.name"
              label="Role Name"
              type="text"
              placeholder="Input Role"
              iclass="text-lowercase"
              :error="errors.name"
            />
            <div class="mb-3 mt-4">
              <label class="form-label">Permission</label>
              <div v-if="permissionList.length === 0" class="text-muted">
                Tidak ada permission tersedia.
              </div>
              <div v-else>
                <template v-for="(group, key) in groupedPermissions" :key="key">
                  <div class="card mb-3">
                    <div class="card-header text-capitalize">{{ key }}</div>
                    <div class="card-body">
                      <div class="row">
                        <label v-for="row in group" :key="row.id" class="col-xl-3 col-md-6 col-sm-12 mb-2">
                          <input
                            v-model="dataForm.permissions"
                            type="checkbox"
                            :value="row.path"
                            class="form-selectgroup-input"
                          />
                          <div class="form-selectgroup-label d-flex align-items-center rounded-1 p-2">
                            <div class="me-3"><span class="form-selectgroup-check rounded-1"></span></div>
                            <div class="form-selectgroup-label-content d-flex align-items-center">
                              <div class="font-weight-medium">{{ row.name }}</div>
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
