<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const router = useRouter();
const title = "Buka Sesi Stock Opname";
useHead({ title });

const { loading, submitForm } = useForm2();

const warehouses = ref<any[]>([]);

const form = ref({
  warehouse_id: "",
  category_id: "",
  notes: "",
});

onMounted(async () => {
  const res = await useApi<{ data: any[] }>("/inventory/warehouses");
  if (res.data?.data) {
    warehouses.value = res.data.data;
  }
});

const onSubmit = async () => {
  if (!form.value.warehouse_id) {
    alert("Silakan pilih Gudang lokasi opname.");
    return;
  }

  const payload: any = {
    warehouse_id: form.value.warehouse_id,
    category_id: form.value.category_id || null,
    notes: form.value.notes || null,
  };

  const res = await submitForm("/inventory/opnames", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/stock-opname");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:clipboard-check">
      <ui-button-back to="/stock-opname" />
    </PageHeader>

    <PageBody>
      <form @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-lg-8 col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Parameter Sesi Stock Opname</h4>
              </div>
              <div class="card-body p-4">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label required">Gudang / Lokasi Opname</label>
                    <select v-model="form.warehouse_id" class="form-select rounded-1" required>
                      <option value="">-- Pilih Gudang Lokasi Opname --</option>
                      <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                        {{ wh.name }} ({{ wh.code }})
                      </option>
                    </select>
                  </div>

                  <div class="col-12">
                    <ui-input2
                      v-model="form.notes"
                      label="Deskripsi / Catatan Sesi Opname"
                      placeholder="Contoh: Opname Akhir Bulan Mei 2026..."
                    />
                  </div>
                </div>
              </div>

              <div class="card-footer bg-transparent border-top p-4 d-flex justify-content-end gap-2">
                <NuxtLink to="/stock-opname" class="btn btn-outline-secondary rounded-1">
                  Batal
                </NuxtLink>
                <button
                  type="submit"
                  class="btn btn-primary rounded-1 px-4"
                  :disabled="loading || !form.warehouse_id"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  Mulai Sesi Opname
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
