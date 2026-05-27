<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Price List" : "Edit Price List");
useHead({ title });

interface PriceList {
  id?: string;
  code: string;
  name: string;
  start_date?: string;
  is_active: boolean;
}

interface PriceListResponse {
  data: PriceList;
  message: string;
}

const dataForm = ref({
  code: "",
  name: "",
  effective_date: "",
  is_active: true,
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<PriceListResponse>(`/price-lists/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data price list tidak ditemukan", "error");
    navigateTo("/price-list");
  } else {
    const pl = resp.value.data;
    dataForm.value = {
      code: pl.code,
      name: pl.name,
      effective_date: pl.start_date ? pl.start_date.substring(0, 10) : "",
      is_active: pl.is_active,
    };
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("price-lists", id);

const onSubmit = async () => {
  const payload = {
    code: dataForm.value.code,
    name: dataForm.value.name,
    currency_code: "IDR",
    start_date: dataForm.value.effective_date ? new Date(dataForm.value.effective_date).toISOString() : null,
    is_active: dataForm.value.is_active,
  };

  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: payload,
  });

  if (success.value) navigateTo("/price-list");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:tag">
      <ui-button-back to="/price-list" />
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
              placeholder="Input price list code (e.g. PL001)"
              :error="errors.code"
              required
            />
            <ui-input2
              v-model="dataForm.name"
              label="Name"
              type="text"
              placeholder="Input price list name"
              :error="errors.name"
              required
            />
            <ui-input2
              v-model="dataForm.effective_date"
              label="Effective Date"
              type="date"
              placeholder="Select effective date"
              :error="errors.effective_date || errors.start_date"
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
