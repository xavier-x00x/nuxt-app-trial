<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Warehouse" : "Edit Warehouse");
useHead({ title });

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  is_active: boolean;
}

interface WarehouseResponse {
  data: Warehouse;
  message: string;
}

const dataForm = ref<Warehouse>({
  id: "",
  code: "",
  name: "",
  address: null,
  city: null,
  province: null,
  is_active: true,
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<WarehouseResponse>(`/warehouses/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data warehouse tidak ditemukan", "error");
    navigateTo("/warehouse");
  } else {
    dataForm.value = resp.value.data;
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("warehouses", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });
  if (success.value) navigateTo("/warehouse");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:building-warehouse">
      <ui-button-back to="/warehouse" />
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
              autofocus
              placeholder="Input warehouse code"
              :error="formatError('Code','code')"
            />
            <ui-input2
              v-model="dataForm.name"
              label="Name"
              type="text"
              placeholder="Input warehouse name"
              :error="formatError('Name','name')"
            />
            <ui-input2
              v-model="dataForm.address"
              label="Address"
              type="text"
              placeholder="Input warehouse address"
              :error="formatError('Address','address')"
            />
            <ui-input2
              v-model="dataForm.city"
              label="City"
              type="text"
              placeholder="Input city"
              :error="formatError('City','city')"
            />
            <ui-input2
              v-model="dataForm.province"
              label="Province"
              type="text"
              placeholder="Input province"
              :error="formatError('Province','province')"
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
