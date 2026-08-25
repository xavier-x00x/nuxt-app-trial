<script setup lang="ts">
const route = useRoute();
const { setFlash } = useFlash();

const id = computed(() => String(route.params.id));
const title = computed(() => id.value === "new" ? "Create Komposisi / BOM" : "Edit Komposisi / BOM");
useHead({ title });

interface ProductComposition {
  id: string;
  parent_product_id: string;
  component_product_id: string;
  quantity: number;
  scrap_percentage: number;
  uom_id: string;
  work_center_id: string | null;
  parent_product?: any;
  component_product?: any;
  uom?: any;
}

interface CompositionResponse {
  data: ProductComposition;
  message: string;
}

const dataForm = ref<ProductComposition>({
  id: "",
  parent_product_id: "",
  component_product_id: "",
  quantity: 1,
  scrap_percentage: 0,
  uom_id: "",
  work_center_id: null,
  parent_product: null,
  component_product: null,
  uom: null,
});

if (id.value !== "new") {
  const { data: resp, error } = await useApiFetch<CompositionResponse>(`/catalog/product-compositions/${id.value}`);
  if (error.value || !resp.value) {
    setFlash("Data Komposisi tidak ditemukan", "error");
    navigateTo("/product-composition");
  } else {
    const d = resp.value.data;
    dataForm.value = {
      id: d.id,
      parent_product_id: d.parent_product_id,
      component_product_id: d.component_product_id,
      quantity: Number(d.quantity) || 1,
      scrap_percentage: Number(d.scrap_percentage) || 0,
      uom_id: d.uom_id,
      work_center_id: d.work_center_id || null,
      parent_product: d.parent_product || null,
      component_product: d.component_product || null,
      uom: d.uom || null,
    };
  }
}

const form = ref<HTMLFormElement>();
const { loading, success, errors, formatError, submitForm } = useForm2();

const { url: submitUrl, method: submitMethod } = useResource("catalog/product-compositions", id);

const onSubmit = async () => {
  await submitForm(submitUrl.value, {
    method: submitMethod.value,
    body: {
      parent_product_id: dataForm.value.parent_product_id,
      component_product_id: dataForm.value.component_product_id,
      quantity: dataForm.value.quantity,
      scrap_percentage: dataForm.value.scrap_percentage,
      uom_id: dataForm.value.uom_id,
      work_center_id: dataForm.value.work_center_id || null,
    },
  });
  if (success.value) navigateTo("/product-composition");
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:binary-tree">
      <ui-button-back to="/product-composition" />
      <ui-button-save :loading="loading" :form="form" @save="form?.requestSubmit()" />
    </PageHeader>
    <PageBody>
      <form ref="form" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-8 col-md-10 col-sm-12">
            <div class="card">
              <div class="card-body">
                <div class="row g-3">
                  <!-- Parent Product -->
                  <div class="col-md-12">
                    <ui-SelectSearch4
                      v-model="dataForm.parent_product_id"
                      v-model:selected-data="dataForm.parent_product"
                      xname="parent_product_id"
                      api-url="/catalog/products/pagination"
                      value-key="id"
                      label="Produk Induk (Parent Product)"
                      :error="formatError('Produk Induk', 'parent_product_id')"
                      placeholder="Cari produk induk (hasil jadi / paket)..."
                    />
                  </div>

                  <!-- Component Product -->
                  <div class="col-md-12">
                    <ui-SelectSearch4
                      v-model="dataForm.component_product_id"
                      v-model:selected-data="dataForm.component_product"
                      xname="component_product_id"
                      api-url="/catalog/products/pagination"
                      value-key="id"
                      label="Komponen Bahan (Component Product)"
                      :error="formatError('Komponen Bahan', 'component_product_id')"
                      placeholder="Cari bahan baku / komponen produk..."
                    />
                  </div>

                  <!-- Quantity -->
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.quantity"
                      label="Kuantitas Bahan"
                      type="number"
                      placeholder="Contoh: 1.5"
                      :error="formatError('Kuantitas', 'quantity')"
                      :decimal="2"
                    />
                  </div>

                  <!-- UOM -->
                  <div class="col-md-6">
                    <ui-SelectSearch4
                      v-model="dataForm.uom_id"
                      v-model:selected-data="dataForm.uom"
                      xname="uom_id"
                      api-url="/catalog/uoms/pagination"
                      value-key="id"
                      label="Satuan Resep (UOM)"
                      :error="formatError('Satuan', 'uom_id')"
                      placeholder="Pilih UOM..."
                    />
                  </div>

                  <!-- Scrap Percentage -->
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.scrap_percentage"
                      label="Toleransi Susut / Rusak (Scrap %)"
                      type="number"
                      placeholder="0.00"
                      :error="formatError('Scrap %', 'scrap_percentage')"
                      :decimal="2"
                    />
                  </div>

                  <!-- Work Center -->
                  <div class="col-md-6">
                    <ui-input2
                      v-model="dataForm.work_center_id"
                      label="Stasiun Kerja / Work Center (Opsional)"
                      type="text"
                      placeholder="Contoh: Butchery, Bakery, Repack Section"
                      :error="formatError('Work Center', 'work_center_id')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
