# JRXML Viewer — Issue: Backend Integration + Migrasi `supplier/[id].vue` (Supplier Detail)

> **Target pembaca**: junior programmer atau AI model yang lebih murah (Haiku/Sonnet/setara).
> **Bahasa**: instruksi pakai Bahasa Indonesia. Code dan technical terms tetap English.
> **Prasyarat**: Library JRXML (`app/lib/jrxml/`) sudah jalan (Fase 1-3 + Fase 6 export). Composable `useJrxmlReport` sudah ada di [app/composables/useJrxmlReport.ts](app/composables/useJrxmlReport.ts).
> **Estimasi**: ±3 jam junior, ±1 jam AI.

---

## Konteks

Saat ini ada **dua jalur report** di project ini:

1. **Lama (legacy)**: Component [app/components/JasperReportViewer.vue](app/components/JasperReportViewer.vue) — props-based API (`jrxml-url`, `data`, `scale`). Tidak terhubung ke engine baru. Tidak support groups, multi-page proper, atau export PDF/Excel/HTML modular.

2. **Baru**: Composable [useJrxmlReport](app/composables/useJrxmlReport.ts) + component [JrxmlViewer](app/components/report/JrxmlViewer.vue). Full engine (parser → paginator → render), toolbar lengkap (print/PDF/Excel/HTML), continuous/single page mode, zoom persist via `useStorage`.

File [app/pages/supplier/[id].vue](app/pages/supplier/[id].vue) **saat ini salah** — namanya "supplier" tapi data dan endpoint-nya **product**. Kemungkinan hasil copy-paste yang belum disesuaikan.

Issue ini:
1. **Ubah domain data**: dari Product → **Supplier** (endpoint, interface, fields, template).
2. Migrasi page ke jalur baru (`useJrxmlReport` + `<JrxmlViewer>`).
3. Establish **pattern reusable** untuk page lain yang perlu render report dari API.

---

## Tujuan

| Task | Goal | Estimasi |
|---|---|---|
| 1 | Pahami flow data: API supplier → `rows` + `parameters` untuk JRXML engine | 20 menit |
| 2 | Refactor [supplier/[id].vue](app/pages/supplier/[id].vue) → domain Supplier + `useJrxmlReport` + `<JrxmlViewer>` | 1.5 jam |
| 3 | Buat template `public/templates/supplier_report.jrxml` (atau sementara pakai mock) | 30 menit |
| 4 | Hapus custom toolbar + bottom bar dummy; pakai toolbar built-in `<JrxmlViewer>` | (otomatis di Task 2) |
| 5 | (Opsional) Helper `useReportFromApi()` kalau pattern akan dipakai berulang | 1 jam |
| 6 | Verifikasi end-to-end + cleanup | 30 menit |

**Total**: ±3 jam junior, ±1 jam AI (skip Task 5).

---

## Konsep Dasar

### Pemisahan `rows` vs `parameters`

JRXML model memisah dua jenis data:
- **`rows`** = data tabular yang **berulang** (detail band di-iterate per row). Untuk page Supplier Detail: list field specification (Supplier Code, Name, Email, dll.) → ini `rows`.
- **`parameters`** = data **static / scalar** yang dipakai di header/footer/title (sekali per report). Untuk page Supplier: `supplierId`, `supplierCode`, `supplierName`, `createdAt` → ini `parameters`.

**Anti-pattern (jangan diulang)**: merge base fields ke setiap row. Cara ini bekerja kalau template pakai `$F{supplierName}`, tapi konseptualnya salah — supplierName bukan field per-row. Pakai `$P{supplierName}` di template.

### Flow Data Backend Integration

```
[Page mount]
   ↓
useApiFetch<Response>('/suppliers/:id')
   ↓
data → transform → tableData (rows) + paramsData
   ↓
useJrxmlReport.load('/templates/supplier_report.jrxml')
useJrxmlReport.setData(tableData)
useJrxmlReport.setParameters(paramsData)
useJrxmlReport.render()
   ↓
<JrxmlViewer :report="..." />
```

---

## Cara Verifikasi Sebelum Mulai

```bash
cd /home/noto/projects/webdev/nuxt-app-trial
pnpm dev
```

1. Buka `/report/invoice` — pastikan jalur baru jalan (engine OK).
2. Buka `/supplier` (list) — pastikan endpoint supplier ada. Cek di Network tab path yang dipakai (kemungkinan `/suppliers` plural). **Catat path-nya** — akan dipakai di Task 2.
3. Klik salah satu row → ke `/supplier/<id>`. Lihat tampilan lama: data product (salah!) + custom toolbar abu. Itu yang akan diganti.

   Kalau page list `/supplier` belum ada, langsung buka URL manual `/supplier/<id>` dengan id valid dari backend.

4. Cek apakah ada template supplier:
   ```bash
   ls public/templates/ | grep -i supplier
   ```
   Kalau belum ada → Task 3 buat baru.

---

## Task 1 — Pahami Data Flow

Identifikasi shape response API supplier. Berdasarkan asumsi backend punya endpoint REST standard `/suppliers/:id`, **expected response**:

```ts
interface Supplier {
  id: string
  code: string                    // e.g. "SUP-00123"
  name: string
  email: string
  phone: string
  fax: string
  website: string
  address: string                 // street/full address
  city: string
  province: string
  postal_code: string
  country: string
  tax_id: string                  // NPWP
  payment_terms: number           // days, e.g. 30
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
  pic_name: string                // person in charge
  pic_phone: string
  pic_email: string
  is_active: boolean
  created_at: string
  updated_at: string
}
interface SupplierResponse { data: Supplier; message: string }
```

**Verifikasi**: sebelum coding, **cek response real dari API**:
```bash
curl -H "Authorization: Bearer <token>" <api>/suppliers/<id> | jq .
```
Atau buka Network tab di browser. **Sesuaikan interface `Supplier` di Task 2 dengan field yang benar-benar ada di response**. Kalau field tidak ada (mis. backend belum punya `bank_name`), set fallback `'-'` di `buildRows`.

---

## Task 2 — Refactor ke Domain Supplier + `useJrxmlReport`

### File yang Diubah
- [app/pages/supplier/[id].vue](app/pages/supplier/[id].vue) — full rewrite.

### Steps

#### Step 2a — Ganti script setup

Replace seluruh `<script setup lang="ts">` jadi:

```vue
<script setup lang="ts">
const route = useRoute()
const { setFlash } = useFlash()

const id = computed(() => String(route.params.id))
const title = 'Supplier Detail'
useHead({ title })

interface Supplier {
  id: string
  code: string
  name: string
  email: string
  phone: string
  fax: string
  website: string
  address: string
  city: string
  province: string
  postal_code: string
  country: string
  tax_id: string
  payment_terms: number
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
  pic_name: string
  pic_phone: string
  pic_email: string
  is_active: boolean
  created_at: string
  updated_at: string
}
interface SupplierResponse { data: Supplier; message: string }

const report = useJrxmlReport()
const supplier = ref<Supplier | null>(null)

const { data: resp, error: fetchError } = await useApiFetch<SupplierResponse>(`/suppliers/${id.value}`)
if (fetchError.value || !resp.value) {
  setFlash('Data supplier tidak ditemukan', 'error')
  navigateTo('/supplier')
} else {
  supplier.value = resp.value.data
}

// Build rows untuk detail band JRXML (1 row per spec field)
function buildRows(s: Supplier): Record<string, unknown>[] {
  const dash = (v: unknown) => (v == null || v === '' ? '-' : String(v))
  return [
    { label: 'Supplier Code', group: 'General', value: dash(s.code) },
    { label: 'Supplier Name', group: 'General', value: dash(s.name) },
    { label: 'Status', group: 'General', value: s.is_active ? 'Active' : 'Inactive' },

    { label: 'Email', group: 'Contact', value: dash(s.email) },
    { label: 'Phone', group: 'Contact', value: dash(s.phone) },
    { label: 'Fax', group: 'Contact', value: dash(s.fax) },
    { label: 'Website', group: 'Contact', value: dash(s.website) },

    { label: 'Address', group: 'Address', value: dash(s.address) },
    { label: 'City', group: 'Address', value: dash(s.city) },
    { label: 'Province', group: 'Address', value: dash(s.province) },
    { label: 'Postal Code', group: 'Address', value: dash(s.postal_code) },
    { label: 'Country', group: 'Address', value: dash(s.country) },

    { label: 'Tax ID (NPWP)', group: 'Tax & Payment', value: dash(s.tax_id) },
    { label: 'Payment Terms', group: 'Tax & Payment', value: s.payment_terms ? `${s.payment_terms} days` : '-' },

    { label: 'Bank Name', group: 'Banking', value: dash(s.bank_name) },
    { label: 'Account Number', group: 'Banking', value: dash(s.bank_account_number) },
    { label: 'Account Holder', group: 'Banking', value: dash(s.bank_account_holder) },

    { label: 'PIC Name', group: 'Person in Charge', value: dash(s.pic_name) },
    { label: 'PIC Phone', group: 'Person in Charge', value: dash(s.pic_phone) },
    { label: 'PIC Email', group: 'Person in Charge', value: dash(s.pic_email) },
  ]
}

// Build parameters untuk $P{} di template (header/footer/title)
function buildParameters(s: Supplier): Record<string, unknown> {
  return {
    supplierId: s.id.slice(0, 8),
    supplierCode: s.code,
    supplierName: s.name,
    createdAt: formatDate(s.created_at),
  }
}

onMounted(async () => {
  if (!supplier.value) return
  try {
    await report.load('/templates/supplier_report.jrxml')
    report.setData(buildRows(supplier.value))
    report.setParameters(buildParameters(supplier.value))
    report.render()
  } catch (e) {
    setFlash(e instanceof Error ? e.message : String(e), 'error')
  }
})

// Surface error dari composable (mis. XML invalid)
watch(report.error, (v) => {
  if (v) setFlash(v, 'error')
})

const downloadCSV = () => {
  if (!supplier.value) return
  const rows = buildRows(supplier.value)
  let csv = 'No,Field,Group,Value\n'
  rows.forEach((r, idx) => {
    csv += `"${idx + 1}","${r.label}","${r.group}","${r.value}"\n`
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Supplier_${supplier.value.code}_Report.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
```

**Perubahan kunci**:
- **Domain change**: `Product` → `Supplier`, endpoint `/products/:id` → `/suppliers/:id`, page title "Product Detail" → "Supplier Detail", redirect on error `/product` → `/supplier`.
- 20 baris spec dengan 6 group (General, Contact, Address, Tax & Payment, Banking, Person in Charge) — bukan lagi 12 baris product.
- `dash()` helper untuk fallback nilai kosong/null jadi `'-'` (tampilan rapih di report).
- `tableData` + `reportData` computed dihapus — fields cuma 1 set, helper `buildRows` cukup.
- Pakai template baru `/templates/supplier_report.jrxml` (lihat Task 3).
- CSV filename pakai supplier code (`Supplier_SUP-00123_Report.csv`).

#### Step 2b — Ganti template

Replace `<template>` jadi:

```vue
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:truck-delivery">
      <ui-button-back to="/supplier" />
      <template #actions>
        <button class="btn btn-outline-secondary btn-sm" @click="downloadCSV" :disabled="!supplier">
          <Icon name="i-tabler:file-spreadsheet" class="me-1" />
          Export CSV
        </button>
      </template>
    </PageHeader>
    <PageBody>
      <div v-if="!supplier" class="text-center py-4">
        <div class="spinner-border text-primary" role="status" />
        <div class="mt-2">Loading Supplier Report...</div>
      </div>
      <ClientOnly v-else>
        <div class="report-viewer-wrapper shadow rounded overflow-hidden">
          <JrxmlViewer :report="report" />
        </div>
      </ClientOnly>
    </PageBody>
  </div>
</template>
```

**Perubahan kunci**:
- Icon `tabler:package` (product) → `tabler:truck-delivery` (supplier).
- Back navigation ke `/supplier` (list page).
- Hapus custom `.report-toolbar` (top) + `.report-bottom-bar` (bottom) dummy — sudah ada di `<JrxmlViewer>` built-in.
- "Export CSV" pindah ke `PageHeader` actions slot — bukan fitur viewer.
- `<ClientOnly>` mandatory karena engine pakai canvas measurement.

#### Step 2c — Ganti CSS

Replace seluruh `<style scoped>` jadi:

```vue
<style scoped>
.report-viewer-wrapper {
  height: calc(100vh - 200px);
  min-height: 600px;
  display: flex;
}
.report-viewer-wrapper :deep(.jrxml-viewer) {
  flex: 1;
  min-height: 0;
}

@media print {
  .page-header,
  :deep(header.jrxml-toolbar),
  :deep(footer.jrxml-footer) {
    display: none !important;
  }
}
</style>
```

CSS dummy toolbar/bottom-bar di file lama dibuang semua. `:deep()` perlu untuk reach style scoped di component child.

### Acceptance
- Buka `/supplier/<id>` — request ke `/suppliers/<id>` (bukan `/products/<id>`).
- Page title browser: "Supplier Detail".
- Header icon: truck delivery.
- Loading state tampil saat fetch.
- Setelah fetch, tampil report dengan toolbar Tabler (Print, Save → PDF/Excel/HTML, mode toggle).
- 20 baris field tampil di detail.
- Back button → ke `/supplier`.
- Klik "Export CSV" di page header → CSV download dengan nama `Supplier_<CODE>_Report.csv`.

### Caveat
- **Endpoint plural / singular**: cek dulu apakah backend pakai `/suppliers/:id` atau `/supplier/:id`. Sesuaikan string di `useApiFetch`. Convention REST = plural, tapi cek dulu.
- **Field tidak tersedia di backend**: pakai `dash()` fallback agar tidak crash. Kalau field critical missing, log warning di console.
- **`is_active` boolean**: kalau backend return `1/0` atau `"true"/"false"`, sesuaikan check-nya (mis. `Boolean(s.is_active)`).
- **`payment_terms` null**: helper sudah handle, tapi pastikan `0` di-treat sebagai "no terms" atau "due immediately" sesuai bisnis.
- **`formatDate`** harus sudah ada sebagai auto-import dari [app/composables/useDateFormatter.ts](app/composables/useDateFormatter.ts). Cek dulu.

---

## Task 3 — Buat Template `supplier_report.jrxml`

### File yang Dibuat
- `public/templates/supplier_report.jrxml`

### Catatan
Kalau **sudah ada `product_report.jrxml`** yang struktur-nya bisa dipakai ulang, copy jadi `supplier_report.jrxml` dan ganti expression-nya. Kalau belum ada acuan, pakai template skeleton di bawah.

### Skeleton Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport name="SupplierReport" pageWidth="595" pageHeight="842"
  leftMargin="40" rightMargin="40" topMargin="40" bottomMargin="40"
  columnWidth="515">

  <parameter name="supplierId" class="java.lang.String"/>
  <parameter name="supplierCode" class="java.lang.String"/>
  <parameter name="supplierName" class="java.lang.String"/>
  <parameter name="createdAt" class="java.lang.String"/>

  <field name="label" class="java.lang.String"/>
  <field name="group" class="java.lang.String"/>
  <field name="value" class="java.lang.String"/>

  <title>
    <band height="80">
      <staticText>
        <reportElement x="0" y="0" width="515" height="28"/>
        <textElement textAlignment="Center"><font size="18" isBold="true"/></textElement>
        <text><![CDATA[SUPPLIER DETAIL REPORT]]></text>
      </staticText>
      <textField>
        <reportElement x="0" y="32" width="515" height="18"/>
        <textElement textAlignment="Center"><font size="12"/></textElement>
        <textFieldExpression><![CDATA[$P{supplierName} + " (" + $P{supplierCode} + ")"]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="0" y="54" width="515" height="14"/>
        <textElement textAlignment="Center"><font size="9"/></textElement>
        <textFieldExpression><![CDATA["Generated: " + $P{createdAt}]]></textFieldExpression>
      </textField>
    </band>
  </title>

  <columnHeader>
    <band height="22">
      <staticText>
        <reportElement x="0" y="0" width="515" height="22" backcolor="#1A1A1A" mode="Opaque" forecolor="#FFFFFF"/>
        <textElement textAlignment="Left" verticalAlignment="Middle">
          <font size="10" isBold="true"/>
        </textElement>
        <text><![CDATA[  Field  /  Group  /  Value]]></text>
      </staticText>
    </band>
  </columnHeader>

  <detail>
    <band height="20">
      <textField>
        <reportElement x="0" y="0" width="180" height="20"/>
        <textElement verticalAlignment="Middle"><font size="9"/></textElement>
        <textFieldExpression><![CDATA[$F{label}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="180" y="0" width="140" height="20"/>
        <textElement verticalAlignment="Middle"><font size="9" isItalic="true"/></textElement>
        <textFieldExpression><![CDATA[$F{group}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="320" y="0" width="195" height="20"/>
        <textElement verticalAlignment="Middle"><font size="9" isBold="true"/></textElement>
        <textFieldExpression><![CDATA[$F{value}]]></textFieldExpression>
      </textField>
    </band>
  </detail>

  <pageFooter>
    <band height="20">
      <textField>
        <reportElement x="0" y="0" width="515" height="14"/>
        <textElement textAlignment="Right"><font size="8"/></textElement>
        <textFieldExpression><![CDATA["Page " + $V{PAGE_NUMBER} + " of " + $V{PAGE_COUNT}]]></textFieldExpression>
      </textField>
    </band>
  </pageFooter>
</jasperReport>
```

### Upgrade dengan Group Bands (Opsional)

Kalau **Fase 4 (Group Bands) sudah diimplementasi** (lihat `issue3.md`), upgrade template di atas untuk pakai group `groupHeader` per kategori (General, Contact, dst.). Cara:

1. Tambah `<group name="fieldGroup">` setelah parameters:
   ```xml
   <group name="fieldGroup">
     <groupExpression><![CDATA[$F{group}]]></groupExpression>
     <groupHeader>
       <band height="20">
         <textField>
           <reportElement x="0" y="2" width="515" height="16" backcolor="#E0E0FF" mode="Opaque"/>
           <textElement verticalAlignment="Middle"><font size="11" isBold="true"/></textElement>
           <textFieldExpression><![CDATA[$F{group}]]></textFieldExpression>
         </textField>
       </band>
     </groupHeader>
   </group>
   ```

2. Hapus kolom "Group" di detail band (sudah ada di header), expand kolom label + value.

3. Hasil: report lebih rapih dengan section per kategori.

**Kalau Fase 4 belum ada**: skip, pakai template skeleton dasar di atas.

### Acceptance
- File `public/templates/supplier_report.jrxml` ada.
- Buka di browser via `$fetch` di Task 2 → tidak ada parser error.
- Render: title "SUPPLIER DETAIL REPORT" + supplier name & code, 20 rows detail, page footer.

---

## Task 4 — Hapus Dummy Toolbar

Sudah include otomatis di Task 2b. Verifikasi:
- Tidak ada `<div class="report-toolbar">` atau `<div class="report-bottom-bar">` di hasil refactor.
- `<JrxmlViewer>` me-render toolbar + footer-nya sendiri.

---

## Task 5 — (Opsional) Composable `useReportFromApi`

Kalau pattern fetch → transform → render akan dipakai banyak page (mis. invoice, supplier, customer, dst.), wrap jadi helper.

### File yang Dibuat
- `app/composables/useReportFromApi.ts`

### Skeleton

```ts
import type { AsyncData } from '#app'

export interface UseReportFromApiOptions<TApi> {
  /** Path JRXML template di public/ (e.g. '/templates/supplier_report.jrxml') */
  template: string
  /** Fetcher function (return useApiFetch result) */
  fetcher: () => AsyncData<TApi | null, Error | null>
  /** Transform API response → rows untuk JRXML detail */
  toRows: (data: TApi) => Record<string, unknown>[]
  /** Transform API response → parameters untuk JRXML $P */
  toParameters?: (data: TApi) => Record<string, unknown>
}

export async function useReportFromApi<TApi>(opts: UseReportFromApiOptions<TApi>) {
  const report = useJrxmlReport()
  const { data, error: fetchError } = await opts.fetcher()

  async function buildAndRender() {
    if (!data.value) return
    try {
      await report.load(opts.template)
      report.setData(opts.toRows(data.value))
      if (opts.toParameters) report.setParameters(opts.toParameters(data.value))
      report.render()
    } catch (e) {
      report.error.value = e instanceof Error ? e.message : String(e)
    }
  }

  onMounted(buildAndRender)

  return { report, sourceData: data, fetchError, refresh: buildAndRender }
}
```

### Pemakaian di `supplier/[id].vue`

```ts
const route = useRoute()
const id = computed(() => String(route.params.id))

const { report, sourceData, fetchError } = await useReportFromApi<SupplierResponse>({
  template: '/templates/supplier_report.jrxml',
  fetcher: () => useApiFetch<SupplierResponse>(`/suppliers/${id.value}`),
  toRows: (resp) => buildRows(resp.data),
  toParameters: (resp) => buildParameters(resp.data),
})

if (fetchError.value || !sourceData.value) {
  setFlash('Data supplier tidak ditemukan', 'error')
  navigateTo('/supplier')
}
const supplier = computed(() => sourceData.value?.data ?? null)
```

### Caveat
- **Premature abstraction risk**: cuma buat helper ini kalau **minimal 3 page** akan pakai pattern yang sama. Kalau cuma 1 page, **skip** — better satu page panjang daripada abstraction yang dipakai sekali.

---

## Task 6 — Verifikasi & Cleanup

### Verifikasi end-to-end

1. `pnpm dev`
2. Buka `/supplier` list, klik salah satu → ke `/supplier/<id>`.
3. Verifikasi:
   - Network tab: request ke `/suppliers/<id>` (plural, sesuai REST).
   - Loading spinner tampil saat fetch.
   - Setelah fetch selesai, JrxmlViewer tampil dengan toolbar Tabler.
   - Title report: "SUPPLIER DETAIL REPORT" + nama supplier.
   - 20 baris field tampil (atau sesuai jumlah field di response).
   - Field null tampil sebagai `-` (bukan empty string).
   - Klik Print → preview print muncul (chrome viewer hilang di print).
   - Klik Save → PDF / Excel / HTML → file ter-download dengan nama `SupplierReport.<ext>`.
   - Page nav next/prev jalan kalau multi-page.
   - Zoom in/out jalan.
   - Klik "Export CSV" di page header → CSV download.
   - Klik back → ke `/supplier`.
4. Test error case: buka `/supplier/invalid-id` → flash "Data supplier tidak ditemukan" + redirect.
5. Tidak ada error console.
6. `pnpm build` → tidak ada TS error.

### Cleanup

- **Cek `JasperReportViewer` legacy usage**:
  ```bash
  grep -rn "JasperReportViewer" app/
  ```
  List file lain yang masih pakai → catat untuk follow-up migrasi batch.

- **`product_report.jrxml`**: kalau page lain juga sudah tidak pakai → kandidat delete. Cek dulu:
  ```bash
  grep -rn "product_report.jrxml" app/ public/
  ```

---

## Definition of Done

Semua harus selesai:
- [ ] Task 2: `supplier/[id].vue` rewrite ke domain Supplier + `useJrxmlReport` + `<JrxmlViewer>`
- [ ] Task 3: Template `supplier_report.jrxml` dibuat & valid
- [ ] Task 4: Custom toolbar + bottom bar dihapus (otomatis dari Task 2b)
- [ ] Task 6: Verifikasi end-to-end + list page lain yang masih pakai legacy

**Skip-able**: Task 5 (`useReportFromApi`) — cuma kalau jelas akan reuse di ≥3 page.

---

## Tips untuk Junior / AI Murah

1. **Verifikasi response API supplier dulu** sebelum coding. Field mungkin tidak sama dengan interface di Task 1. Sesuaikan.
2. **Cek endpoint plural/singular** (`/suppliers/:id` vs `/supplier/:id`) lewat Network tab atau API docs.
3. **Pakai `<ClientOnly>`** mandatory di template — engine JRXML pakai canvas measurement yang tidak ada di SSR.
4. **`await useApiFetch`** di top-level setup script OK karena Nuxt mengerti async setup.
5. **Sebaliknya, `report.load()` HARUS di `onMounted`** karena pakai canvas + DOM. Kalau di-`await` di setup, akan crash di SSR.
6. **`dash()` helper**: konsisten pakai ini untuk semua field — null/undefined/empty string semua jadi `-`. Bikin tampilan rapih.
7. **Sample acuan**: buka `/report/invoice` atau `/report/grouped-invoice` — copy pattern struktur page-nya.
8. **Watch `report.error`** — bind ke `setFlash` agar XML parser error tidak silent.
9. **Commit per task**:
   ```
   git commit -m "feat(supplier): rewrite detail page with real supplier domain"
   git commit -m "feat(jrxml): add supplier_report.jrxml template"
   ```

---

## Hal yang **Bukan** Scope Issue Ini

- **Migrasi page lain** yang pakai `<JasperReportViewer>` — list saja untuk follow-up.
- **Delete `JasperReportViewer.vue`** — tunda sampai semua page migrated.
- **Backend API supplier baru** — assume sudah ada `/suppliers/:id` di backend. Kalau belum, koordinasi dengan backend dev dulu.
- **List page `/supplier`** — assume sudah ada. Kalau belum, separate concern.
- **URL parameter passing** ke template (mis. format options) — separate issue.
- **Edit supplier** — out of scope, page ini view-only.
- **Print barcode supplier** — out of scope.

---

## Pasca Implementasi

- Update `app/data/menus.json` kalau perlu menu entry "Supplier Report" (cek dulu sudah ada / belum).
- Kalau Fase 4 (Group Bands) selesai, upgrade `supplier_report.jrxml` untuk pakai `<group name="fieldGroup">` (lihat catatan di Task 3) — section per kategori (General, Contact, Address, dst.).
- Catat di follow-up: page mana saja yang masih pakai `<JasperReportViewer>` legacy → bikin issue migrasi batch.
