<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Store" : "Edit Store");
useHead({ title });

interface Store {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
}

interface StoreResponse {
  data: Store;
  message: string;
}

const dataForm = ref<Store>({
  id: 0,
  code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  is_active: false,
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<StoreResponse>(`/stores/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data toko tidak ditemukan", "error");
    navigateTo("/toko");
  } else {
    dataForm.value = resp.value.data;
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("stores", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });
  if (success.value) navigateTo("/toko");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package">
      <ui-button-back to="/toko" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <ui-input2
              v-model="dataForm.code"
              label="Code"
              type="text"
              placeholder="Input store code"
              :error="errors.code"
            />
            <ui-input2
              v-model="dataForm.name"
              label="Name"
              type="text"
              placeholder="Input store name"
              :error="errors.name"
            />
            <ui-textarea
              v-model="dataForm.address"
              label="Address"
              placeholder="Input address"
              :error="errors.address"
            />
            <ui-input2
              v-model="dataForm.phone"
              label="Phone"
              type="text"
              placeholder="Input phone number"
              :error="errors.phone"
            />
            <ui-input2
              v-model="dataForm.email"
              label="Email"
              type="email"
              placeholder="Input email"
              :error="errors.email"
            />
            <div class="mb-3">
              <label class="form-label">Status</label>
              <div class="form-selectgroup">
                <label class="form-selectgroup-item">
                  <input
                    v-model="dataForm.is_active"
                    type="radio"
                    name="is_active"
                    :value="true"
                    class="form-selectgroup-input"
                  />
                  <span class="form-selectgroup-label">Active</span>
                </label>
                <label class="form-selectgroup-item">
                  <input
                    v-model="dataForm.is_active"
                    type="radio"
                    name="is_active"
                    :value="false"
                    class="form-selectgroup-input"
                  />
                  <span class="form-selectgroup-label">Inactive</span>
                </label>
              </div>
              <span class="text-danger error-text" v-text="errors.is_active"></span>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
