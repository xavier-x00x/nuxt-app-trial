<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Tax" : "Edit Tax");
useHead({ title });

interface Tax {
  name: string;
  rate_percentage: number | string;
  tax_account_id: string | null;
}

interface TaxResponse {
  data: Tax;
  message: string;
}

const dataForm = ref<Tax>({
  name: "",
  rate_percentage: "",
  tax_account_id: null,
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<TaxResponse>(`/taxes/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data pajak tidak ditemukan", "error");
    navigateTo("/tax");
  } else {
    dataForm.value = {
      name: resp.value.data.name,
      rate_percentage: resp.value.data.rate_percentage,
      tax_account_id: resp.value.data.tax_account_id,
    };
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("taxes", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: {
      ...dataForm.value,
      rate_percentage: Number(dataForm.value.rate_percentage),
      tax_account_id: dataForm.value.tax_account_id || null,
    },
  });
  if (success.value) navigateTo("/tax");
};

// get coa list
const { data: coaResp } = await useApiFetch<any>(`/accounts`);
const coaList = computed(() => coaResp.value?.data || []);
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:receipt-tax">
      <ui-button-back to="/tax" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <ui-input2
              v-model="dataForm.name"
              label="Tax Name"
              type="text"
              placeholder="e.g. PPN 11%"
              :error="errors.name"
            />
            <ui-input2
              v-model="dataForm.rate_percentage"
              label="Rate Percentage (%)"
              type="number"
              step="0.01"
              placeholder="e.g. 11.00"
              :error="errors.rate_percentage"
            />
            <div class="mb-3">
              <label class="form-label">Tax Account</label>
              <select v-model="dataForm.tax_account_id" class="form-select">
                <option :value="null">-- Select Tax Account --</option>
                <option v-for="coa in coaList" :key="coa.id" :value="coa.id">
                  {{ coa.account_code }} - {{ coa.name }}
                </option>
              </select>
              <span class="text-danger error-text" v-text="errors.tax_account_id"></span>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
