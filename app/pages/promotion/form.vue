<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const editId = computed(() => route.query.id as string | undefined);
const isEdit = computed(() => !!editId.value);

const title = computed(() => (isEdit.value ? "Edit Program Promosi" : "Buat Program Promosi"));
useHead({ title: title.value });

const { loading, submitForm, formatError } = useForm2();

const form = ref({
  name: "",
  description: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  priority: 1,
  is_active: true,
  reward_type: "DISCOUNT_PCT",
  reward_value: 10,
  condition_type: "MIN_SPEND",
  min_spend_amount: 0,
});

onMounted(async () => {
  if (isEdit.value && editId.value) {
    const res = await useApi<{ data: any }>(`/sales/promotions/${editId.value}`);
    if (res.data?.data) {
      const p = res.data.data;
      form.value = {
        name: p.name || "",
        description: p.description || "",
        start_date: p.start_date ? p.start_date.split("T")[0] : "",
        end_date: p.end_date ? p.end_date.split("T")[0] : "",
        priority: Number(p.priority || 1),
        is_active: p.is_active ?? true,
        reward_type: p.rewards?.[0]?.reward_type || "DISCOUNT_PCT",
        reward_value: Number(p.rewards?.[0]?.reward_value || 10),
        condition_type: p.conditions?.[0]?.condition_type || "MIN_SPEND",
        min_spend_amount: Number(p.conditions?.[0]?.required_value || 0),
      };
    }
  }
});

const onSubmit = async () => {
  if (!form.value.name) {
    alert("Nama program promo wajib diisi.");
    return;
  }

  const payload: any = {
    name: form.value.name,
    description: form.value.description || null,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
    priority: Number(form.value.priority || 1),
    is_active: form.value.is_active,
    conditions: [
      {
        condition_type: form.value.condition_type,
        target_type: "CART_TOTAL",
        required_value: Number(form.value.min_spend_amount || 0),
      },
    ],
    rewards: [
      {
        reward_type: form.value.reward_type,
        target_type: "CART_TOTAL",
        reward_value: Number(form.value.reward_value || 0),
      },
    ],
  };

  const url = isEdit.value ? `/sales/promotions/${editId.value}` : "/sales/promotions";
  const method = isEdit.value ? "PUT" : "POST";

  const res = await submitForm(url, {
    method,
    body: payload,
  });

  if (res?.success) {
    router.push("/promotion");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:discount-2">
      <ui-button-back to="/promotion" />
    </PageHeader>

    <PageBody>
      <form @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-lg-8 col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Pengaturan Program Promo</h4>
              </div>
              <div class="card-body p-4">
                <div class="row g-3">
                  <div class="col-12">
                    <ui-input2
                      v-model="form.name"
                      label="Nama Program Promosi"
                      placeholder="Contoh: Diskon Kemerdekaan 17%, Cashback Belanja..."
                      :required="true"
                      :error="formatError('Nama Promo', 'name')"
                    />
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.start_date"
                      type="date"
                      label="Tanggal Mulai Berlaku"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.end_date"
                      type="date"
                      label="Tanggal Berakhir"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label required">Bentuk Hadiah / Diskon (Reward)</label>
                    <select v-model="form.reward_type" class="form-select rounded-1">
                      <option value="DISCOUNT_PCT">Diskon Persentase (%)</option>
                      <option value="DISCOUNT_FIXED">Potongan Nominal Tetap (Rp)</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.reward_value"
                      type="number"
                      :label="form.reward_type === 'DISCOUNT_PCT' ? 'Besar Diskon (%)' : 'Potongan Nominal (Rp)'"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.min_spend_amount"
                      type="number"
                      label="Syarat Minimum Belanja (Rp)"
                      placeholder="0 jika tanpa minimum belanja"
                    />
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.priority"
                      type="number"
                      label="Prioritas Aplikasi Promo (1 - 100)"
                    />
                  </div>

                  <div class="col-12">
                    <ui-input2
                      v-model="form.description"
                      label="Deskripsi / Syarat & Ketentuan"
                      placeholder="Keterangan promo untuk kasir & pelanggan..."
                    />
                  </div>

                  <div class="col-12">
                    <label class="form-check form-switch mt-2">
                      <input
                        v-model="form.is_active"
                        class="form-check-input"
                        type="checkbox"
                      />
                      <span class="form-check-label fw-medium">Aktifkan Program Promosi</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="card-footer bg-transparent border-top p-4 d-flex justify-content-end gap-2">
                <NuxtLink to="/promotion" class="btn btn-outline-secondary rounded-1">
                  Batal
                </NuxtLink>
                <button
                  type="submit"
                  class="btn btn-primary rounded-1 px-4"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  Simpan Promo
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
