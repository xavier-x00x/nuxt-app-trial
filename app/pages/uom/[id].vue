<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Measurement Unit" : "Edit Measurement Unit");
useHead({ title });

interface UOM {
  id: string;
  code: string;
  name: string;
}

interface UOMResponse {
  data: UOM;
  message: string;
}

const dataForm = ref<UOM>({
  id: "",
  code: "",
  name: "",
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<UOMResponse>(`/uoms/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data UOM tidak ditemukan", "error");
    navigateTo("/uom");
  } else {
    dataForm.value = resp.value.data;
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("uoms", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });
  if (success.value) navigateTo("/uom");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:scale">
      <ui-button-back to="/uom" />
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
              placeholder="Input UOM code"
              :error="formatError('Code','code')"
            />
            <ui-input2
              v-model="dataForm.name"
              label="Name"
              type="text"
              placeholder="Input UOM name"
              :error="formatError('Name','name')"
            />
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
