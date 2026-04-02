<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
interface Props {
  title: string;
  isEdit?: boolean;
  id?: number;
  modelValue?: {
    name: string;
    permission: string[];
  };
}

interface Permission {
  id: number;
  path: string;
  name: string;
}

const form = ref();
const props = defineProps<Props>();

// lokal copy form
const localForm = ref({
  name: props.modelValue?.name ?? "",
  permission: props.modelValue?.permission ?? [],
});

if (props.modelValue) {
  // jika props modelValue ada
  watch(props.modelValue, (val) => {
    // console.log(val);
    localForm.value = { ...(val ?? { name: "", permission: [] }) };
  });
}

const permiss: any = await useFetch(
  "http://localhost:3050/api/autorization/routes",
  {
    params: {
      search: "",
      page: 1, // agar data di load pertama kali, page harus 1
      limit: 100000,
      order_by: "path asc",
    },
  }
);

const permissionList = ref(permiss.data.value.data) as Ref<unknown[]>;

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};

  for (const item of permissionList.value as Permission[]) {
    if (
      item.name.includes("index") ||
      item.name.includes("sign-in") ||
      item.name.includes("sign-up") ||
      item.name.includes("sign-out") ||
      item.name.includes("2")
    ) {
      continue;
    }

    let key = item.name.includes("-") ? item.name.split("-")[0] : item.name;
    key = key === undefined ? "" : key;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key]!.push(item);
  }

  return groups;
});

const metode = !props.id ? "POST" : "PUT";
const parms = !props.id ? `` : `/${props.id}`;

const { loading, success, errors, submitForm } = useForm();

const onSubmit = async () => {
  await submitForm("http://localhost:3050/api/autorization/roles" + parms, {
    method: metode,
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
        @click="form.requestSubmit()"
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
        {{ loading ? "Loading..." : "Simpan" }}
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
              placeholder="Input Rule"
              iclass="text-lowercase"
              :error="errors.Name"
            />
            <div class="mb-3">
              <label class="form-label">Permission</label>
              <div class="row">
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
                      v-model="localForm.permission"
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
