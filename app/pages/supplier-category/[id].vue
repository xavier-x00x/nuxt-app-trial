<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Kategori Supplier" : "Edit Kategori Supplier");
useHead({ title });

interface SupplierCategory {
  id: string;
  name: string;
  description: string;
}

interface SupplierCategoryResponse {
  data: SupplierCategory;
  message: string;
}

const dataForm = ref<SupplierCategory>({
  id: "",
  name: "",
  description: "",
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<SupplierCategoryResponse>(`/purchasing/supplier-categories/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data kategori supplier tidak ditemukan", "error");
    navigateTo("/supplier-category");
  } else {
    dataForm.value = {
      id: resp.value.data.id,
      name: resp.value.data.name,
      description: resp.value.data.description,
    };
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("purchasing/supplier-categories", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });
  if (success.value) navigateTo("/supplier-category");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:category">
      <ui-button-back to="/supplier-category" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <ui-input2
              v-model="dataForm.name"
              label="Name"
              type="text"
              autofocus
              placeholder="Input category name"
              :error="formatError('Name','name')"
            />
            <ui-textarea
              v-model="dataForm.description"
              label="Description"
              placeholder="Input description"
              :error="formatError('Description','description')"
            />
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
