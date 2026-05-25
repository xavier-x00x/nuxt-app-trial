<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Account" : "Edit Account");
useHead({ title });

interface Account {
  account_number: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
}

interface AccountResponse {
  data: Account;
  message: string;
}

const dataForm = ref<Account>({
  account_number: "",
  account_name: "",
  account_type: "",
  is_active: true,
});

const accountTypes = [
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
  { value: "EQUITY", label: "Equity" },
  { value: "REVENUE", label: "Revenue" },
  { value: "EXPENSE", label: "Expense" },
];

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<AccountResponse>(`/accounts/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data account tidak ditemukan", "error");
    navigateTo("/account");
  } else {
    dataForm.value = resp.value.data;
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("accounts", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });
  if (success.value) navigateTo("/account");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:book">
      <ui-button-back to="/account" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <ui-input2
              v-model="dataForm.account_number"
              label="Account Number"
              type="text"
              placeholder="Input account number"
              :error="errors.account_number"
            />
            <ui-input2
              v-model="dataForm.account_name"
              label="Account Name"
              type="text"
              placeholder="Input account name"
              :error="errors.account_name"
            />
            <div class="mb-3">
              <label class="form-label">Account Type</label>
              <select
                v-model="dataForm.account_type"
                class="form-select"
              >
                <option value="" disabled>-- Select Account Type --</option>
                <option
                  v-for="type in accountTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
              <span class="text-danger error-text" v-text="errors.account_type"></span>
            </div>
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
