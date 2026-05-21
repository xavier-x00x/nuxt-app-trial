<script setup lang="ts">
interface Props {
  title: string;
  isEdit?: boolean;
  id?: number;
  modelValue?: {
    name: string;
    permissions: string[];
  };
}

interface Permission {
  id: number;
  path: string;
  name: string;
}

interface ListResponse<T> {
  data: T[];
  total: number;
  total_filtered: number;
}

const props = defineProps<Props>();
const form = ref<HTMLFormElement>();
const config = useRuntimeConfig();
const authStore = useAuthStore();

const localForm = ref({
  name: props.modelValue?.name ?? "",
  permissions: props.modelValue?.permissions ?? [],
});

watch(
  () => props.modelValue,
  (val) => {
    localForm.value = { name: val?.name ?? "", permissions: val?.permissions ?? [] };
  },
  { immediate: true, deep: true }
);

const permissionLoadError = ref<string | null>(null);
const permissionList = ref<Permission[]>([]);

async function loadPermissions() {
  permissionLoadError.value = null;
  try {
    const res = await $fetch<ListResponse<Permission>>(
      `${config.public.apiUrl}/permissions`,
      {
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
        params: {
          limit: 9999,
          order_column: "name",
          order_dir: "asc",
        },
      }
    );
    permissionList.value = res.data;
  } catch (err) {
    permissionLoadError.value = "Gagal memuat permissions.";
    console.error("Gagal load permissions:", err);
  }
}

onMounted(() => {
  loadPermissions();
});

const EXCLUDED_PATTERNS = ["index", "sign-in", "sign-up", "sign-out"] as const;
const HAS_DIGIT = /\d/;

const shouldExcludePermission = (name: string): boolean =>
  EXCLUDED_PATTERNS.some((p) => name.includes(p)) || HAS_DIGIT.test(name);

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};

  for (const item of permissionList.value) {
    if (shouldExcludePermission(item.name)) continue;

    const key = item.name.includes("-") ? item.name.split("-")[0] ?? "" : item.name;
    (groups[key] ??= []).push(item);
  }

  return groups;
});

const submitUrl = computed(
  () =>
    props.id
      ? `${config.public.apiUrl}/roles/${props.id}`
      : `${config.public.apiUrl}/roles`
);
const submitMethod = computed(() => (props.id ? "PUT" : "POST"));

const { loading, success, errors, submitForm } = useForm();

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: localForm.value,
  });

  if (success.value) {
    navigateTo("/role");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <NuxtLink
        to="/role"
        class="btn btn-outline-secondary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:arrow-left" class="icon icon-2 me-0" />
        Kembali
      </NuxtLink>
      <button
        :disabled="loading"
        type="button"
        class="btn btn-primary rounded-1"
        @click="form?.requestSubmit()"
      >
        <Icon
          v-if="!loading"
          name="i-tabler:clipboard-check"
          class="icon icon-2 me-1"
        />
        <span
          v-else
          class="spinner-border text-cyan icon icon-2 me-2"
          role="status"
        ></span>
        Simpan
      </button>
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <ui-input
              v-model="localForm.name"
              label="Role Name"
              type="text"
              placeholder="Input Role"
              iclass="text-lowercase"
              :error="errors.Name"
            />
            <div class="mb-3 mt-4">
              <label class="form-label">Permission</label>
              <div v-if="permissionLoadError" class="alert alert-danger">
                {{ permissionLoadError }}
              </div>
              <div v-else-if="permissionList.length === 0" class="text-muted">
                Tidak ada permission tersedia.
              </div>
              <div v-else class="row">
                <template
                  v-for="(group, key, index) in groupedPermissions"
                  :key="key"
                >
                  <div
                    v-if="index > 0"
                    class="w-100 border-bottom mt-2 mb-3"
                  ></div>
                  <label
                    v-for="row in group"
                    :key="row.id"
                    class="col-xl-3 col-md-6 col-sm-12 mb-2"
                  >
                    <input
                      v-model="localForm.permissions"
                      type="checkbox"
                      :value="row.name"
                      class="form-selectgroup-input"
                    />
                    <div
                      class="form-selectgroup-label d-flex align-items-center rounded-1 p-2"
                    >
                      <div class="me-3">
                        <span class="form-selectgroup-check rounded-1"></span>
                      </div>
                      <div
                        class="form-selectgroup-label-content d-flex align-items-center"
                      >
                        <div>
                          <div class="font-weight-medium">{{ row.name }}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </template>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
