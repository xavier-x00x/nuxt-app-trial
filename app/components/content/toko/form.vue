<script setup lang="ts">
interface Props {
  title: string;
  isEdit?: boolean;
  id?: number;
}

interface Toko {
  code: string;
  name: string;
  npwp: string;
  address: string;
  phone: string;
  email: string;
  phone2: string;
  email2: string;
  status: boolean;
}

interface TokoResponse {
  data: Toko;
  error?: string;
}

const props = defineProps<Props>();
const form = ref<HTMLFormElement>();
const config = useRuntimeConfig();
const { setFlash } = useFlash();

const dataForm = ref<Toko>({
  code: "",
  name: "",
  npwp: "",
  address: "",
  phone: "",
  email: "",
  phone2: "",
  email2: "",
  status: true,
});

if (props.id) {
  const { data: tokoResponse, error: tokoError, status, refresh: refreshToko, pending } = await useApiFetch<TokoResponse>(
    `/stores/${props.id}`
  );

  watchEffect(() => {
    if (tokoResponse.value) {
      dataForm.value = tokoResponse.value.data;
    } else {
      if (tokoError.value?.statusCode === 500) {
        refreshToko();
      }

      if (tokoError.value) {
        const statusCode = tokoError.value.statusCode;
        const message = tokoError.value.data?.message || "Unknown error";

        if (statusCode === 404) {
          setFlash(`Error ${statusCode} : ${message}`, "error");
          navigateTo("/toko");
        } else if (pending.value === false) {
          setFlash(`Error ${statusCode} : ${message}`, "error");
        }
      }
    }
  });
}

const submitUrl = computed(
  () =>
    props.id
      ? `${config.public.apiUrl}/stores/${props.id}`
      : `${config.public.apiUrl}/stores`
);
const submitMethod = computed(() => (props.id ? "PUT" : "POST"));

const { loading, success, errors, submitForm } = useForm();

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });

  if (success.value) {
    navigateTo("/toko");
  }
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
            <ui-input
              v-model="dataForm.code"
              label="Code"
              type="text"
              placeholder="Input store code"
              :error="errors.code"
            />
            <ui-input
              v-model="dataForm.name"
              label="Name"
              type="text"
              placeholder="Input store name"
              :error="errors.name"
            />
            <ui-input
              v-model="dataForm.npwp"
              label="NPWP"
              type="text"
              placeholder="Input NPWP"
              :error="errors.npwp"
            />
            <div class="mb-2">
              <label class="form-label mb-1">Address</label>
              <textarea
                v-model="dataForm.address"
                class="form-control rounded-1"
                rows="3"
                placeholder="Input address"
              ></textarea>
              <span class="text-danger error-text" v-text="errors.address"></span>
            </div>
            <ui-input
              v-model="dataForm.phone"
              label="Phone"
              type="text"
              placeholder="Input phone number"
              :error="errors.phone"
            />
            <ui-input
              v-model="dataForm.email"
              label="Email"
              type="email"
              placeholder="Input email"
              :error="errors.email"
            />
            <ui-input
              v-model="dataForm.phone2"
              label="Phone 2"
              type="text"
              placeholder="Input alternative phone number"
              :error="errors.phone2"
            />
            <ui-input
              v-model="dataForm.email2"
              label="Email 2"
              type="email"
              placeholder="Input alternative email"
              :error="errors.email2"
            />
            <div class="mb-3">
              <label class="form-label">Status</label>
              <div class="form-selectgroup">
                <label class="form-selectgroup-item">
                  <input
                    v-model="dataForm.status"
                    type="radio"
                    name="status"
                    :value="true"
                    class="form-selectgroup-input"
                  />
                  <span class="form-selectgroup-label">Active</span>
                </label>
                <label class="form-selectgroup-item">
                  <input
                    v-model="dataForm.status"
                    type="radio"
                    name="status"
                    :value="false"
                    class="form-selectgroup-input"
                  />
                  <span class="form-selectgroup-label">Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
