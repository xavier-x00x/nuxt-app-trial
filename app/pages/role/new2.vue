<script setup lang="ts">
const title = "Create New Role";
useHead({
  title: title,
});

const form = ref();

interface Permission {
  id: number;
  path: string;
  name: string;
}

const dataForm = reactive({
  name: "",
  permission: [],
});

const permissionList = ref<Array<unknown>>([]) as Ref<unknown[]>;

const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {};

  for (const item of permissionList.value) {
    const key = item.name.includes("-") ? item.name.split("-")[0] : item.name;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return groups;
});

onMounted(async () => {
  const res: { data: any } = await useApi(
    "http://localhost:3050/api/autorization/routes",
    {
      params: {
        search: "",
        page: 1, // agar data di load pertama kali, page harus 1
        limit: 10000,
        order_by: "path asc",
      },
    }
  );
  permissionList.value = res?.data;
});

const onSubmit = async () => {
  // console.log(dataForm);
  const res = await useApi("http://localhost:3050/api/autorization/roles", {
    method: "POST",
    body: dataForm,
  });
  console.log(res);
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <button
        type="button"
        class="btn btn-outline-primary rounded-1"
        @click="form.requestSubmit()"
      >
        <Icon name="i-tabler:clipboard-check" class="icon icon-2 me-1" />
        Simpan
      </button>
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <ui-input
              v-model="dataForm.name"
              label="Rule"
              type="text"
              placeholder="Input Rule"
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
                      v-model="dataForm.permission"
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
            {{ dataForm.permission }}
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
