<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Brand" : "Edit Brand");
useHead({ title });

interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface BrandResponse {
  data: Brand;
  message: string;
}

const dataForm = ref<Brand>({
  id: "",
  name: "",
  description: "",
  logo_url: "",
  is_active: true,
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<BrandResponse>(`/catalog/brands/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data Brand tidak ditemukan", "error");
    navigateTo("/brand");
  } else {
    dataForm.value = {
      id: resp.value.data.id,
      name: resp.value.data.name,
      description: resp.value.data.description || "",
      logo_url: resp.value.data.logo_url || "",
      is_active: resp.value.data.is_active ?? true,
    };
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("catalog/brands", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: {
      ...dataForm.value,
      description: dataForm.value.description || null,
      logo_url: dataForm.value.logo_url || null,
    },
  });
  if (success.value) navigateTo("/brand");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:tags">
      <ui-button-back to="/brand" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            <ui-input2
              v-model="dataForm.name"
              label="Brand Name"
              type="text"
              autofocus
              placeholder="Input brand name"
              :error="formatError('Brand Name', 'name')"
            />
            <ui-textarea
              v-model="dataForm.description"
              label="Description"
              placeholder="Input description (optional)"
              :error="formatError('Description', 'description')"
            />
            <ui-input2
              v-model="dataForm.logo_url"
              label="Logo URL"
              type="text"
              placeholder="https://example.com/logo.png (optional)"
              :error="formatError('Logo URL', 'logo_url')"
            />
            <div class="mb-3">
              <label class="form-label">Status</label>
              <label class="form-check form-switch">
                <input
                  v-model="dataForm.is_active"
                  class="form-check-input"
                  type="checkbox"
                />
                <span class="form-check-label">{{ dataForm.is_active ? 'Active' : 'Inactive' }}</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
