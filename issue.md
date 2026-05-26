# Issue: Penyesuaian UsulanForm.vue — Perbaikan Input & Layout

> **Target pembaca**: junior programmer atau AI model yang lebih murah.
> **Bahasa**: instruksi pakai Bahasa Indonesia. Code dan technical terms tetap English.
> **Asumsi**: pembaca sudah familiar dengan Vue 3 Composition API dan Nuxt.

---

## Konteks

File utama: `app/components/usulan/UsulanForm.vue`
Komponen select: `app/components/ui/SelectSearch5.vue`

Form ini digunakan untuk membuat/mengedit proposal (usulan) master data. Ada 3 `actionType`:
- **CREATE** — buat data baru, user mengisi field satu per satu
- **UPDATE** — ubah data yang sudah ada
- **DELETE** — hapus data yang sudah ada

Saat ini form CREATE sudah berjalan cukup baik. Yang perlu diperbaiki adalah:
1. Field yang ber-key `_id` belum otomatis pakai komponen select
2. Layout belum rapi
3. Form UPDATE masih menampilkan textarea Payload JSON (seharusnya form interaktif)
4. Form DELETE masih pakai input text Entity ID (seharusnya pakai select)

---

## Referensi Penting

### SelectSearch5.vue — Cara Pakai

```vue
<UiSelectSearch5
  v-model="item[field.key]"               <!-- value yang tersimpan (misal: UUID) -->
  v-model:display-value="item[field.key+'_text']"  <!-- teks yang ditampilkan -->
  v-model:selected-data="item.selectedObj"  <!-- full object yang terpilih (optional) -->
  value-key="id"
  :api-url="'/products/pagination'"
  xname="product_id"
  placeholder="Pilih product..."
  :clearable="true"
  :selected-format="(item) => item.name"
/>
```

- `v-model` → menyimpan value (misal UUID/ID)
- `v-model:display-value` → menyimpan teks display
- `v-model:selected-data` → menyimpan full object yang terpilih (**ini yang penting untuk auto-fill**)

### entityFields — Struktur Definisi Field

Lihat object `entityFields` di `UsulanForm.vue`. Setiap entity punya array `FieldDef`:
```ts
{ key: "category_id", label: "Category", type: "selectx", apiUrl: "/categories/pagination", col: "col-md-6" }
```

Field dengan `type: "selectx"` sudah pakai SelectSearch5. Yang perlu diubah adalah field yang key-nya mengandung `_id` tapi type-nya masih `"text"`.

---

## Tahapan Implementasi

### Tahap 1: Ubah FieldDef yang ber-key `_id` jadi `selectx`

**Apa yang harus dilakukan:**

Di object `entityFields`, cari semua field yang key-nya mengandung `_id` tapi type-nya masih `"text"`. Ubah menjadi `type: "selectx"` dan tambahkan `apiUrl` yang sesuai.

Contoh field yang perlu diubah:
| Entity | Key | apiUrl yang sesuai |
|---|---|---|
| SUPPLIER | `supplier_category_id` | `/supplier-categories/pagination` |
| TAX | `tax_account_id` | `/chart-of-accounts/pagination` |
| PRODUCT_PRICE | `price_list_id` | `/price-lists/pagination` |
| PRODUCT_PRICE | `product_id` | `/products/pagination` |
| PRODUCT_PRICE | `uom_id` | `/uoms/pagination` |
| PRODUCT_UOM_CONVERSION | `product_id` | `/products/pagination` |
| PRODUCT_UOM_CONVERSION | `uom_id` | `/uoms/pagination` |
| PRODUCT_SUPPLIER | `product_id` | `/products/pagination` |
| PRODUCT_SUPPLIER | `supplier_id` | `/suppliers/pagination` |
| SUPPLIER | `ap_account_id` | `/chart-of-accounts/pagination` |

> **Catatan**: Sesuaikan `apiUrl` dengan endpoint API yang tersedia di backend. Jika ragu, cek pattern yang sudah ada di PRODUCT (`/categories/pagination`, `/uoms/pagination`).

---

### Tahap 2: Rapikan Layout

**Apa yang harus dilakukan:**

- Pastikan setiap field di `entityFields` punya `col` yang sesuai (misal `col-md-6` untuk field pendek, `col-md-12` untuk field panjang seperti name/address)
- Hapus `{{ item }}` debug output di template (line 266 saat ini)
- Pastikan spacing antar field konsisten

---

### Tahap 3: Perbaiki Form UPDATE

**Kondisi sekarang:** Menampilkan input Entity ID (text) + textarea Payload (JSON string). User harus tulis JSON manual — ini tidak user-friendly.

**Yang diharapkan:**
1. Tampilkan **SelectSearch5** di bagian atas item untuk memilih entity yang ingin di-update. SelectSearch5 harus mengarah ke API entity yang sesuai (misal `/products/pagination` untuk PRODUCT)
2. Waktu user memilih item dari select, **auto-fill semua field** di bawahnya dengan data dari object yang terpilih
3. User kemudian bisa mengubah field yang ingin di-update
4. Tampilkan field-field yang sama seperti CREATE (pakai `currentFields`)

**Cara implementasi:**

1. Buat mapping API URL per entity type untuk pencarian data:
```ts
const entitySearchUrl: Record<string, string> = {
  PRODUCT: "/products/pagination",
  SUPPLIER: "/suppliers/pagination",
  CHART_OF_ACCOUNT: "/chart-of-accounts/pagination",
  TAX: "/taxes/pagination",
  PRODUCT_PRICE: "/product-prices/pagination",
  PRODUCT_UOM_CONVERSION: "/product-uom-conversions/pagination",
  PRODUCT_SUPPLIER: "/product-suppliers/pagination",
};
```

2. Di template, untuk `proposalType === 'UPDATE'`:
   - Tambahkan SelectSearch5 dengan `v-model:selected-data` untuk mendapat full object
   - Watch `selected-data` — ketika berubah, isi `item.entity_id` dan spread semua field dari object terpilih ke `item`

3. Tampilkan field-field yang sama seperti CREATE di bawah select (reuse template yang sudah ada)

4. Di `onSubmit`, untuk UPDATE: kumpulkan field yang berubah sebagai payload (sama seperti CREATE)

**Pseudocode handler ketika select terpilih:**
```ts
function onEntitySelected(item: Record<string, any>, idx: number) {
  items.value[idx].entity_id = item.id;
  // Isi field-field dari object terpilih
  for (const field of currentFields.value) {
    items.value[idx][field.key] = item[field.key] ?? null;
  }
}
```

---

### Tahap 4: Perbaiki Form DELETE

**Kondisi sekarang:** Menampilkan input text Entity ID. User harus paste UUID manual.

**Yang diharapkan:**
1. Tampilkan **SelectSearch5** untuk memilih entity yang ingin dihapus
2. Ketika terpilih, simpan `entity_id` dari item yang dipilih
3. Opsional: tampilkan ringkasan data yang akan dihapus (read-only) agar user bisa memastikan

**Cara implementasi:**

1. Ganti input text `entity_id` dengan SelectSearch5 (pakai `entitySearchUrl` yang sama dari Tahap 3)
2. Saat item terpilih, set `item.entity_id = selectedItem.id`
3. Bisa tampilkan info item yang dipilih di bawah select (read-only, optional)

---

### Tahap 5: Perbaiki `onSubmit` untuk UPDATE dan DELETE

**Apa yang harus dilakukan:**

- Untuk **UPDATE**: kumpulkan field dari `currentFields` (sama seperti CREATE), jangan lagi pakai `JSON.parse(item.payload)`
- Untuk **DELETE**: pastikan `entity_id` terisi dari SelectSearch5, payload bisa kosong `{}`
- Pastikan `_text` fields juga ikut tersimpan di payload jika diperlukan

---

### Tahap 6: Perbaiki `fillForm` untuk Edit Mode

**Apa yang harus dilakukan:**

Saat form dalam mode edit (ada `props.proposal`):
- Untuk **UPDATE**: spread `payload_json` ke fields item (sama seperti CREATE), bukan simpan sebagai string
- Untuk **DELETE**: set `entity_id` dan pastikan SelectSearch5 bisa menampilkan display value yang benar

---

## Catatan Tambahan

- Jangan ubah struktur Props atau interface yang sudah ada kecuali perlu
- Test manual: pastikan CREATE, UPDATE, DELETE semuanya bisa submit dengan benar
- Perhatikan `v-model:display-value` di SelectSearch5 — ini penting supaya saat edit, label yang tampil benar (bukan UUID)
- Untuk form edit UPDATE, `selectedFormat` di SelectSearch5 harus bisa menampilkan nama item dari data yang sudah tersimpan
