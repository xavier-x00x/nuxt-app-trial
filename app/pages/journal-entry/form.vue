<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const router = useRouter();
const title = "Input Jurnal Manual";
useHead({ title });

const formRef = ref<HTMLFormElement>();
const { loading, submitForm } = useForm2();

const accounts = ref<any[]>([]);

const form = ref({
  entry_date: new Date().toISOString().split("T")[0],
  description: "",
  lines: [
    { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
    { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
  ],
});

onMounted(async () => {
  const res = await useApi<{ data: any[] }>("/finance/accounts/pagination?limit=300");
  if (res.data?.data) {
    accounts.value = res.data.data;
  }
});

const onDebitChange = (line: any) => {
  if (Number(line.debit_amount) > 0) {
    line.credit_amount = 0;
  }
};

const onCreditChange = (line: any) => {
  if (Number(line.credit_amount) > 0) {
    line.debit_amount = 0;
  }
};

const addLine = () => {
  form.value.lines.push({
    account_id: "",
    debit_amount: 0,
    credit_amount: 0,
    description: "",
  });
};

const removeLine = (idx: number) => {
  if (form.value.lines.length <= 2) {
    alert("Jurnal minimal membutuhkan 2 baris akun.");
    return;
  }
  form.value.lines.splice(idx, 1);
};

const totalDebit = computed(() => {
  return form.value.lines.reduce((sum, l) => sum + Number(l.debit_amount || 0), 0);
});

const totalCredit = computed(() => {
  return form.value.lines.reduce((sum, l) => sum + Number(l.credit_amount || 0), 0);
});

const isBalanced = computed(() => {
  return totalDebit.value > 0 && Math.abs(totalDebit.value - totalCredit.value) < 0.01;
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const onSubmit = async () => {
  if (!form.value.description) {
    alert("Keterangan jurnal wajib diisi.");
    return;
  }
  if (!isBalanced.value) {
    alert("Jurnal tidak seimbang! Total Debit dan Total Kredit harus sama.");
    return;
  }

  const invalidLine = form.value.lines.find(
    (l) => !l.account_id || (Number(l.debit_amount || 0) === 0 && Number(l.credit_amount || 0) === 0)
  );
  if (invalidLine) {
    alert("Pastikan semua baris telah memilih akun dan memiliki nilai debit/kredit.");
    return;
  }

  const payload = {
    entry_date: form.value.entry_date,
    description: form.value.description,
    posted_by_id: "00000000-0000-0000-0000-000000000001",
    lines: form.value.lines.map((l) => ({
      account_id: l.account_id,
      debit_amount: Number(l.debit_amount || 0),
      credit_amount: Number(l.credit_amount || 0),
      description: l.description || null,
    })),
  };

  const res = await submitForm("/finance/journals/manual", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/journal-entry");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:book">
      <ui-button-back to="/journal-entry" />
      <ui-button-save :loading="loading" :disabled="!isBalanced" :form="formRef" @save="formRef?.requestSubmit()" />
    </PageHeader>

    <PageBody>
      <form ref="formRef" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            <!-- Header Section -->
            <div class="row align-items-stretch mb-4">
              <div class="col-md-5">
                <div class="p-3 border rounded-1 bg-body-secondary h-100">
                  <label class="form-label fw-bold mb-2">Tanggal Jurnal <span class="text-danger">*</span></label>
                  <ui-input2
                    v-model="form.entry_date"
                    type="date"
                    :hide-label="true"
                    :required="true"
                  />

                  <div class="form-text mt-3 mb-0">
                    <Icon name="i-tabler:info-circle" /> Jurnal manual akan langsung diposting ke Buku Besar secara realtime setelah disimpan.
                  </div>
                </div>
              </div>

              <div class="col-md-7 d-flex flex-column">
                <ui-textarea
                  v-model="form.description"
                  class="flex-grow-1"
                  label="Keterangan / Deskripsi Transaksi"
                  placeholder="Contoh: Pembayaran beban listrik, air, & operasional bulan berjalan..."
                  :required="true"
                />

                <!-- Balance Status Banner -->
                <div class="mt-2 p-2 border rounded-1 bg-body-tertiary d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <span
                      v-if="isBalanced"
                      class="badge bg-success text-white px-2 py-1 me-2 fw-bold"
                    >
                      BALANCE
                    </span>
                    <span
                      v-else
                      class="badge bg-danger text-white px-2 py-1 me-2 fw-bold"
                    >
                      UNBALANCED
                    </span>

                    <span
                      v-if="isBalanced"
                      class="text-success fw-semibold small"
                    >
                      Total Debit & Kredit seimbang ({{ formatCurrency(totalDebit) }})
                    </span>
                    <span
                      v-else
                      class="text-danger fw-bold small"
                    >
                      Selisih: {{ formatCurrency(Math.abs(totalDebit - totalCredit)) }}
                    </span>
                  </div>

                  <div class="text-muted small">
                    Debit: <strong class="text-info">{{ formatCurrency(totalDebit) }}</strong> | Kredit: <strong class="text-primary">{{ formatCurrency(totalCredit) }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Section (Table Grid) -->
            <label class="fw-semibold mb-3">Rincian Pos Debit & Kredit ({{ form.lines.length }})</label>

            <div class="table-responsive border rounded-1 mb-3 bg-body shadow-sm" style="max-height: 380px; min-height: 220px; overflow-y: auto;">
              <table class="table table-hover align-middle mb-0 table-compact">
                <thead class="sticky-top">
                  <tr>
                    <th style="width: 40px" class="text-center">#</th>
                    <th style="min-width: 280px">Akun (Chart of Accounts) <span class="text-danger">*</span></th>
                    <th style="min-width: 220px">Keterangan Baris</th>
                    <th style="width: 180px" class="text-end">Debit (Rp) <span class="text-danger">*</span></th>
                    <th style="width: 180px" class="text-end">Kredit (Rp) <span class="text-danger">*</span></th>
                    <th style="width: 50px" class="text-center">
                      <Icon name="i-tabler:settings" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, idx) in form.lines" :key="idx">
                    <td class="text-center text-muted fw-bold small align-middle">{{ idx + 1 }}</td>
                    <td>
                      <select v-model="line.account_id" class="form-select rounded-1" required>
                        <option value="">-- Pilih Akun COA --</option>
                        <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                          {{ acc.account_code }} - {{ acc.name || acc.account_name }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <ui-input2
                        v-model="line.description"
                        type="text"
                        placeholder="Uraian Jurnal..."
                        :hide-label="true"
                      />
                    </td>
                    <td>
                      <ui-input2
                        v-model="line.debit_amount"
                        type="number"
                        placeholder="0"
                        :hide-label="true"
                        iclass="text-info fw-bold"
                        @update:model-value="onDebitChange(line)"
                      />
                    </td>
                    <td>
                      <ui-input2
                        v-model="line.credit_amount"
                        type="number"
                        placeholder="0"
                        :hide-label="true"
                        iclass="text-primary fw-bold"
                        @update:model-value="onCreditChange(line)"
                      />
                    </td>
                    <td class="text-center align-middle">
                      <button
                        v-if="form.lines.length > 2"
                        type="button"
                        class="btn btn-sm btn-link text-danger p-1"
                        title="Hapus baris"
                        @click="removeLine(idx)"
                      >
                        <Icon name="i-tabler:trash" style="font-size: 1.25rem;" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Add Row Button -->
            <button
              type="button"
              class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center rounded-1 mt-2 mb-4"
              style="border-style: dashed; border-width: 2px;"
              @click="addLine"
            >
              <Icon name="i-tabler:plus" class="me-1" style="font-size: 1.15rem;" /> Tambah Baris Akun Lainnya
            </button>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>

<style scoped>
.table-compact > :not(caption) > * > * {
  padding: 0.35rem 0.5rem !important;
}
.table-responsive thead.sticky-top th {
  background-color: var(--tblr-bg-surface, #182433) !important;
  z-index: 2;
}
</style>
