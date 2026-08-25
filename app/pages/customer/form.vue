<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const editId = computed(() => route.query.id as string | undefined);
const isEdit = computed(() => !!editId.value);

const title = computed(() => (isEdit.value ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"));
useHead({ title: title.value });

const { loading, submitForm, formatError } = useForm2();

const form = ref({
  code: "",
  name: "",
  phone_number: "",
  email: "",
  address: "",
  customer_tier: "REGULAR",
  credit_limit: 0,
  term_of_payment_days: 0,
});

onMounted(async () => {
  if (isEdit.value && editId.value) {
    const res = await useApi<{ data: any }>(`/sales/customers/${editId.value}`);
    if (res.data?.data) {
      const c = res.data.data;
      form.value = {
        code: c.code || "",
        name: c.name || "",
        phone_number: c.phone_number || "",
        email: c.email || "",
        address: c.address || "",
        customer_tier: c.customer_tier || "REGULAR",
        credit_limit: Number(c.credit_limit || 0),
        term_of_payment_days: Number(c.term_of_payment_days || 0),
      };
    }
  }
});

const onSubmit = async () => {
  if (!form.value.name) {
    alert("Nama pelanggan wajib diisi.");
    return;
  }

  const payload: any = {
    ...form.value,
    code: form.value.code || null,
    phone_number: form.value.phone_number || null,
    email: form.value.email || null,
    address: form.value.address || null,
    credit_limit: Number(form.value.credit_limit || 0),
    term_of_payment_days: Number(form.value.term_of_payment_days || 0),
  };

  const url = isEdit.value ? `/sales/customers/${editId.value}` : "/sales/customers";
  const method = isEdit.value ? "PUT" : "POST";

  const res = await submitForm(url, {
    method,
    body: payload,
  });

  if (res?.success) {
    router.push("/customer");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:users">
      <ui-button-back to="/customer" />
    </PageHeader>

    <PageBody>
      <form @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-lg-8 col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Informasi Profil Member / Pelanggan</h4>
              </div>
              <div class="card-body p-4">
                <div class="row g-3">
                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.code"
                      label="Kode Member (Kosongkan untuk otomatis)"
                      placeholder="Contoh: MBR/2605/00001"
                      :disabled="isEdit"
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label required">Tier / Level Member</label>
                    <select v-model="form.customer_tier" class="form-select rounded-1" required>
                      <option value="REGULAR">REGULAR</option>
                      <option value="SILVER">SILVER</option>
                      <option value="GOLD">GOLD</option>
                      <option value="PLATINUM">PLATINUM</option>
                      <option value="GROSIR_B2B">GROSIR B2B</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.name"
                      label="Nama Lengkap"
                      placeholder="Nama pelanggan / instansi..."
                      :required="true"
                      :error="formatError('Nama', 'name')"
                    />
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.phone_number"
                      label="Nomor Telepon / WhatsApp"
                      placeholder="Contoh: 08123456789"
                    />
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.email"
                      type="email"
                      label="Email"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.credit_limit"
                      type="number"
                      label="Limit Piutang / Kredit (Rp)"
                    />
                  </div>

                  <div class="col-12">
                    <ui-input2
                      v-model="form.address"
                      label="Alamat Lengkap"
                      placeholder="Alamat domisili / pengiriman..."
                    />
                  </div>
                </div>
              </div>

              <div class="card-footer bg-transparent border-top p-4 d-flex justify-content-end gap-2">
                <NuxtLink to="/customer" class="btn btn-outline-secondary rounded-1">
                  Batal
                </NuxtLink>
                <button
                  type="submit"
                  class="btn btn-primary rounded-1 px-4"
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  Simpan Pelanggan
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
