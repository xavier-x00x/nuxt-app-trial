<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Kategori" : "Edit Kategori");
useHead({ title });

interface Category {
  id: string;
  parent_id: string | null;
  parent: Category | null;
  name: string;
  slug: string;
  default_markup_pct: number;
}

interface CategoryResponse {
  data: Category;
  message: string;
}

const dataForm = ref<Category>({
  id: "",
  parent_id: null,
  parent: null,
  name: "",
  slug: "",
  default_markup_pct: 0,
});

const mapCategoryForm = (data: Category): Category => ({
  id: data.id,
  parent_id: data.parent_id,
  parent: data.parent ? mapCategoryForm(data.parent) : null,
  name: data.name,
  slug: data.slug,
  default_markup_pct: data.default_markup_pct,
})

const markup = ref<any>(0);

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<CategoryResponse>(`/categories/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data kategori tidak ditemukan", "error");
    navigateTo("/category");
  } else {
    dataForm.value = mapCategoryForm(resp.value.data);
    markup.value = resp.value.data.default_markup_pct;
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("categories", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: dataForm.value,
  });
  if (success.value) navigateTo("/category");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:category">
      <ui-button-back to="/category" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-8 col-sm-12">
            {{ dataForm }}
            <ui-input2
              v-model="dataForm.name"
              label="Name"
              type="text"
              autofocus
              placeholder="Input category name"
              :error="formatError('Name','name')"
            />
            <ui-input2
              v-model="dataForm.slug"
              label="Slug"
              type="text"
              placeholder="Input slug"
              :error="formatError('Slug','slug')"
            />
            <ui-SelectSearch4
              v-model="dataForm.parent_id"
              v-model:selected-data="dataForm.parent"
              xname="parent_id"
              api-url="/categories/pagination"
              value-key="id"
              label="Parent"
              :error="formatError('Parent','parent_id')"
              placeholder="Select parent category"
            />
            <ui-input2
              v-model="dataForm.default_markup_pct"
              type="number"
              label="Default Markup %"
              placeholder="0.00"
              :error="formatError('Default Markup','default_markup_pct')"
              :decimal="2"
            />
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
