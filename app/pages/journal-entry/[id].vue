<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { JournalEntryDetail } from "~/types/journal-entry";

const route = useRoute();
const id = route.params.id as string;

const journal = ref<JournalEntryDetail | null>(null);
const loading = ref(true);

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const fetchDetail = async () => {
  loading.value = true;
  try {
    const res = await useApi<{ data: JournalEntryDetail }>(`/finance/journals/${id}`);
    if (res.data?.data) {
      journal.value = res.data.data;
    }
  } catch (err) {
    console.error("Failed to fetch journal detail:", err);
  } finally {
    loading.value = false;
  }
};

const reverseJournal = async () => {
  if (!confirm("Apakah Anda yakin ingin membalik (reverse) jurnal ini?")) return;
  const res = await submitForm(`/finance/journals/${id}/reverse`, {
    method: "POST",
    body: {
      reversed_by_id: "00000000-0000-0000-0000-000000000001",
      reason: "Pembalikan transaksi manual",
    },
  });
  if (res?.success) {
    await fetchDetail();
  }
};

onMounted(() => {
  fetchDetail();
});

useHead({
  title: computed(() => (journal.value ? `Jurnal: ${journal.value.entry_number}` : "Detail Jurnal")),
});
</script>

<template>
  <div>
    <PageHeader
      :title="journal ? `Jurnal ${journal.entry_number}` : 'Detail Jurnal'"
      icon="i-tabler:book"
    >
      <div class="d-flex gap-2">
        <ui-button-back to="/journal-entry" />
        <button
          v-if="journal && journal.status === 'POSTED'"
          type="button"
          class="btn btn-outline-danger rounded-1"
          :disabled="submitting"
          @click="reverseJournal"
        >
          <Icon name="i-tabler:rotate-clockwise" class="icon icon-2" />
          Balik Jurnal (Reverse)
        </button>
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted mt-2">Memuat dokumen jurnal...</div>
      </div>

      <div v-else-if="journal" class="row g-3">
        <!-- Header Info -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="card-title mb-0 fw-bold">
                  {{ journal.entry_number }}
                </h3>
                <span
                  :class="[
                    'badge fs-4 px-3 py-2',
                    journal.status === 'POSTED' ? 'bg-success text-white' : 'bg-danger text-white'
                  ]"
                >
                  {{ journal.status }}
                </span>
              </div>

              <div class="row g-3">
                <div class="col-md-3">
                  <div class="text-muted small">Tanggal Jurnal</div>
                  <div class="fw-bold">{{ formatDate(journal.entry_date) }}</div>
                </div>
                <div class="col-md-6">
                  <div class="text-muted small">Deskripsi Transaksi</div>
                  <div>{{ journal.description }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Dokumen Sumber</div>
                  <div>{{ journal.source_document_type || 'MANUAL' }} ({{ journal.source_document_id || '-' }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ledger Lines Table -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent border-bottom">
              <h4 class="card-title mb-0">Rincian Pos Debit & Kredit</h4>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small">
                    <th style="width: 50px;">#</th>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Keterangan Baris</th>
                    <th class="text-end" style="width: 180px;">Debit (Rp)</th>
                    <th class="text-end" style="width: 180px;">Kredit (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, idx) in journal.lines" :key="line.id || idx">
                    <td>{{ idx + 1 }}.</td>
                    <td class="fw-bold text-primary">{{ line.account_code || line.account?.account_code || '-' }}</td>
                    <td class="fw-medium">{{ line.account_name || line.account?.name || line.name || line.account_id }}</td>
                    <td class="text-muted small">{{ line.description || '-' }}</td>
                    <td class="text-end fw-bold text-info">
                      {{ Number(line.debit_amount) > 0 ? formatCurrency(Number(line.debit_amount)) : '-' }}
                    </td>
                    <td class="text-end fw-bold text-primary">
                      {{ Number(line.credit_amount) > 0 ? formatCurrency(Number(line.credit_amount)) : '-' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-body-tertiary fw-bold fs-4">
                    <td colspan="4" class="text-end">Total:</td>
                    <td class="text-end text-info">{{ formatCurrency(Number(journal.total_debit)) }}</td>
                    <td class="text-end text-primary">{{ formatCurrency(Number(journal.total_credit)) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  </div>
</template>
