<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();
const title = "Edit User";
useHead({ title });

interface User {
  name: string;
  username: string;
  email: string;
  store_id: string | null;
  store_name: string | null;
  role: string;
}

interface UserResponse {
  data: User;
  message: string;
}

const userId = computed(() => String(route.params.id));

const { data: userResp } = await useApiFetch<UserResponse>(
  `/users/${userId.value}`,
);


const dataForm = ref<User>({
  name: "",
  username: "",
  email: "",
  store_id: null,
  store_name: null,
  role: "",
});

const selectedItemStore = ref({ id: "", name: "", address: "" });
const selectedItemRole = ref({ name: "" });

watchEffect(() => {
  const user = userResp.value?.data;
  if (user) {
    dataForm.value = { ...user, store_id: user.store_id ?? null, store_name: user.store_name ?? null, role: user.role ?? "" };
    selectedItemStore.value = { id: user.store_id ?? "", name: user.store_name ?? "", address: "" };
    selectedItemRole.value = { name: user.role ?? "" };
  }
});

const form = ref<HTMLFormElement>();
const { loading, success, errors, submitForm, formatError } = useForm2();

const onSubmit = async () => {
  await submitForm(`/users/${userId.value}`, {
    method: "PUT",
    body: dataForm.value,
  });

  if (success.value) {
    setFlash("Data berhasil diubah", "success");
    navigateTo("/user");
  }
};
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <ui-button-back to="/user" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-6 col-md-8 col-sm-12">
            {{ errors }}

            <ui-input2
              v-model="dataForm.name"
              label="Name"
              type="text"
              placeholder="Input Name"
              :error="errors.name"
            />
            <div class="mb-2">
              <label class="form-label mb-1">Role</label>
              <ui-select-search4
                v-model="dataForm.role"
                v-model:selected-data="selectedItemRole"
                xname="role"
                value-key="name"
                placeholder="Input Role"
                :api-url="`/roles/pagination`"
                :select-format="(item) => `${(item as any).name}`"
                :selected-format="(item) => `${(item as any).name}`"
              />
              <span class="text-danger error-text" v-text="errors.role"></span>
            </div>
            <ui-input2
              v-model="dataForm.username"
              label="Username"
              type="text"
              placeholder="Input Username"
              :error="errors.username"
            />
            <ui-input2
              v-model="dataForm.email"
              label="Email"
              type="email"
              placeholder="Input Email"
              :error="errors.email"
            />
            <div class="mb-2">
              <label class="form-label mb-1">Store</label>
              <ui-select-search4
                v-model="dataForm.store_id"
                v-model:selected-data="selectedItemStore"
                xname="store_id"
                value-key="id"
                placeholder="Input Store"
                :api-url="`/stores/pagination`"
                :select-format="(item) => `${item.name}`"
                :selected-format="(item: any) => `${item.name}`"
              />
              <span class="text-danger error-text" v-text="formatError('Store', 'store_id')"></span>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
