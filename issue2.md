# JRXML Viewer — Fase 5: Toolbar Features Lengkap

> **Target pembaca**: junior programmer atau AI model yang lebih murah (Haiku/Sonnet/setara).
> **Bahasa**: instruksi pakai Bahasa Indonesia. Code dan technical terms tetap English.
> **Prasyarat**: Fase 1–6 (parsing → render → export) sudah jalan. Fase 7 (polish) boleh belum.
> **Asumsi**: pembaca sudah familiar dengan Vue 3 Composition API, TypeScript dasar, Bootstrap 5 modal/dropdown.

---

## Konteks Project

Library JRXML Viewer di-build di dalam Nuxt project ini sebagai bagian dari rencana di `/home/noto/.claude/plans/saya-ingin-membuat-library-keen-koala.md`.

**Status toolbar saat ini** ([app/components/report/JrxmlViewer.vue](app/components/report/JrxmlViewer.vue)):
- ✓ Print button
- ✓ Save dropdown (PDF/Excel/HTML)
- ✓ Mode toggle (Continuous/Single)
- ✓ Page nav + zoom di footer
- ✗ **Font size slider** — `fontFactor` ref sudah ada di useJrxmlReport, JrxmlBox sudah multiply font size dengan factor → tinggal UI slider di toolbar
- ✗ **Parameters dialog** — modal edit `report.parameters.value`, rerender on apply
- ✗ **Search highlight** — search bar overlay + highlight matches di canvas
- ✗ **Bookmarks panel** — depends on group bands (belum diimplementasi; SKIP untuk issue ini)

Issue ini fokus ke 3 fitur yang **tidak bergantung** ke group bands. Bookmarks akan ditangani di issue tersendiri setelah groups diimplementasi.

---

## Tujuan Fase 5

Lengkapi toolbar viewer sehingga punya UX setara Stimulsoft Report Viewer untuk fitur common.

| Task | Goal | Estimasi |
|---|---|---|
| 1 | Font size slider — dropdown dengan range 0.5x–2.0x | 1 jam |
| 2 | Parameters dialog — modal Bootstrap, dynamic form by param type, apply triggers rerender | 2 jam |
| 3 | Search highlight — input overlay, highlight matches di canvas, next/prev nav | 2.5 jam |

**Total estimasi**: ±5.5 jam junior, ±2 jam AI.

---

## Cara Verifikasi Sebelum Mulai

```bash
cd /home/noto/projects/webdev/nuxt-app-trial
pnpm dev
```

Buka `http://localhost:3000/report/invoice`. Pastikan:
- Report tampil di canvas
- Print + Save (PDF/Excel/HTML) berfungsi
- Page nav + zoom berfungsi
- Mode toggle berfungsi

Kalau ada yang error, fix dulu sebelum lanjut.

---

## Task 1 — Font Size Slider

### Goal
User bisa ubah ukuran font global di seluruh viewer (multiplier 0.5x–2.0x). Berguna untuk preview accessibility / printing dengan ukuran berbeda.

### Konteks
- `useJrxmlReport()` sudah expose `fontFactor: Ref<number>` (default 1).
- `JrxmlPage.vue` sudah pass `:font-factor` ke `JrxmlBox.vue`.
- `JrxmlBox.vue` line `fontSize: '${p.font.size * factor.value}px'` sudah multiply dengan factor.
- **Yang kurang**: UI di toolbar untuk ubah `fontFactor.value`.

### File yang Diubah
- `app/components/report/JrxmlViewer.vue`

### Steps

1. **Baca dulu** `JrxmlViewer.vue` cari section toolbar. Setelah Mode dropdown (`<div class="dropdown">` terakhir di header), tambah dropdown baru untuk font:

   ```vue
   <div class="dropdown">
     <button
       class="btn btn-icon btn-sm-custom"
       type="button"
       data-bs-toggle="dropdown"
       data-bs-auto-close="outside"
       :aria-label="t('fontSize')"
       :title="t('fontSize')"
     >
       <Icon name="tabler:typography" />
     </button>
     <div class="dropdown-menu p-3 jrxml-font-dropdown">
       <label class="form-label small mb-2">
         {{ t('fontSize') }}: <strong>{{ Math.round(report.fontFactor.value * 100) }}%</strong>
       </label>
       <input
         type="range"
         class="form-range"
         min="0.5"
         max="2"
         step="0.1"
         :value="report.fontFactor.value"
         @input="onFontFactorInput"
       >
       <div class="d-flex justify-content-between small text-muted mt-1">
         <span>50%</span>
         <button class="btn btn-link btn-sm p-0" type="button" @click="report.fontFactor.value = 1">
           Reset
         </button>
         <span>200%</span>
       </div>
     </div>
   </div>
   ```

2. Tambah handler di `<script setup>`:

   ```ts
   function onFontFactorInput(e: Event) {
     const v = Number((e.target as HTMLInputElement).value)
     if (Number.isFinite(v)) props.report.fontFactor.value = v
   }
   ```

3. Tambah label ke object `labels`:

   ```ts
   const labels = {
     // ... existing labels
     fontSize: 'Font size',
   }
   ```

4. Tambah CSS:

   ```css
   .jrxml-font-dropdown {
     min-width: 240px;
   }
   ```

5. **`data-bs-auto-close="outside"`** penting — biar dropdown nggak nutup saat user drag slider.

### Acceptance
- Buka viewer → klik icon typography di toolbar → dropdown terbuka dengan slider.
- Drag slider ke kanan → font di canvas membesar real-time.
- Drag ke kiri → mengecil.
- Klik "Reset" → kembali ke 100%.
- Persen indicator di atas update tiap kali slider digerakkan.

### Caveat
- **Jangan** ubah `JrxmlBox.vue` — logic factor sudah jalan.
- Kalau Fase 7 (persist preference) sudah diimplementasi, `fontFactor` belum di-persist — bisa ditambah ke `useStorage` di issue terpisah.

---

## Task 2 — Parameters Dialog

### Goal
User bisa edit parameter report (mis. tanggal, nama company, dst) via modal Bootstrap, lalu klik "Apply" → report rerender dengan parameter baru.

### Konteks
- `useJrxmlReport()` sudah expose:
  - `report.value.parameters: JrParameter[]` — definisi parameter dari XML (name + class + defaultExpression)
  - `parameters: Ref<Record<string, unknown>>` — current values
  - `setParameters(params)` — merge values
  - `render()` — re-paginate dengan parameter terbaru
- **Yang kurang**: UI modal untuk edit `parameters.value`.

### File yang Diubah/Dibuat
- **BARU**: `app/components/report/JrxmlParametersDialog.vue`
- **DIUBAH**: `app/components/report/JrxmlViewer.vue` — tambah tombol toolbar + mount dialog

### Steps

#### Step 2a — Buat `JrxmlParametersDialog.vue`

Buat file baru `app/components/report/JrxmlParametersDialog.vue`:

```vue
<template>
  <div ref="modalEl" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Report Parameters</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
        </div>
        <div class="modal-body">
          <div v-if="!params.length" class="text-muted text-center py-3">
            No parameters defined.
          </div>
          <div v-for="p in params" :key="p.name" class="mb-3">
            <label class="form-label">
              {{ p.name }}
              <span class="badge bg-light text-muted ms-1">{{ shortType(p.class) }}</span>
            </label>
            <input
              v-if="inputType(p.class) === 'number'"
              type="number"
              class="form-control"
              :value="localValues[p.name] ?? ''"
              step="any"
              @input="e => setValue(p.name, parseNumber((e.target as HTMLInputElement).value))"
            >
            <input
              v-else-if="inputType(p.class) === 'date'"
              type="date"
              class="form-control"
              :value="formatDateInput(localValues[p.name])"
              @input="e => setValue(p.name, parseDate((e.target as HTMLInputElement).value))"
            >
            <input
              v-else-if="inputType(p.class) === 'boolean'"
              type="checkbox"
              class="form-check-input"
              :checked="!!localValues[p.name]"
              @change="e => setValue(p.name, (e.target as HTMLInputElement).checked)"
            >
            <textarea
              v-else
              class="form-control"
              rows="2"
              :value="String(localValues[p.name] ?? '')"
              @input="e => setValue(p.name, (e.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-link" @click="resetToDefaults">Reset</button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" @click="onApply">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { JrParameter } from '~/lib/jrxml/types'

const props = defineProps<{
  params: JrParameter[]
  values: Record<string, unknown>
}>()
const emit = defineEmits<{ apply: [values: Record<string, unknown>] }>()

const modalEl = ref<HTMLElement | null>(null)
const localValues = ref<Record<string, unknown>>({ ...props.values })

watch(() => props.values, (v) => { localValues.value = { ...v } }, { deep: true })

function setValue(name: string, v: unknown) {
  localValues.value = { ...localValues.value, [name]: v }
}

function shortType(cls: string): string {
  const parts = cls.split('.')
  return parts[parts.length - 1] || cls
}

function inputType(cls: string): 'number' | 'date' | 'boolean' | 'text' {
  const t = cls.toLowerCase()
  if (t.includes('integer') || t.includes('long') || t.includes('double') || t.includes('float') || t.includes('decimal') || t.includes('number')) return 'number'
  if (t.includes('date') || t.includes('time')) return 'date'
  if (t.includes('bool')) return 'boolean'
  return 'text'
}

function parseNumber(s: string): number | null {
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function parseDate(s: string): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function formatDateInput(v: unknown): string {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'string') {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return ''
}

function resetToDefaults() {
  const defaults: Record<string, unknown> = {}
  for (const p of props.params) {
    defaults[p.name] = null
  }
  localValues.value = defaults
}

function onApply() {
  emit('apply', { ...localValues.value })
  hide()
}

let modalInstance: { show: () => void; hide: () => void } | null = null

async function ensureModal() {
  if (modalInstance) return modalInstance
  if (!modalEl.value) return null
  const bs = await import('bootstrap')
  modalInstance = new bs.Modal(modalEl.value) as { show: () => void; hide: () => void }
  return modalInstance
}

async function show() {
  const m = await ensureModal()
  m?.show()
}

function hide() {
  modalInstance?.hide()
}

defineExpose({ show, hide })

onMounted(() => { /* lazy init on first show */ })
onBeforeUnmount(() => { modalInstance?.hide() })
</script>
```

#### Step 2b — Wire ke `JrxmlViewer.vue`

1. Tambah tombol di toolbar (setelah Mode dropdown):

   ```vue
   <button
     class="btn btn-icon btn-sm-custom"
     type="button"
     :aria-label="t('parameters')"
     :title="t('parameters')"
     @click="openParameters"
   >
     <Icon name="tabler:adjustments" />
   </button>
   ```

2. Tambah dialog component **sebelum `</div>` penutup root**:

   ```vue
   <JrxmlParametersDialog
     ref="paramsDialog"
     :params="report.report.value?.parameters ?? []"
     :values="report.parameters.value"
     @apply="onApplyParameters"
   />
   ```

3. Tambah di `<script setup>`:

   ```ts
   import { ref } from 'vue'
   import JrxmlParametersDialog from './JrxmlParametersDialog.vue'

   const paramsDialog = ref<InstanceType<typeof JrxmlParametersDialog> | null>(null)

   function openParameters() {
     paramsDialog.value?.show()
   }

   function onApplyParameters(values: Record<string, unknown>) {
     props.report.setParameters(values)
     props.report.render()
   }
   ```

4. Tambah label:

   ```ts
   const labels = {
     // ... existing
     parameters: 'Parameters',
   }
   ```

5. **Bootstrap modal JS** harus tersedia. Project ini sudah pakai Tabler (yang include Bootstrap), tapi kalau import `bootstrap` gagal, install:

   ```bash
   pnpm add bootstrap
   ```

   Atau cek `nuxt.config.ts` — kalau ada plugin yang sudah expose `bootstrap` global, pakai dari sana.

### Acceptance
- Klik icon `tabler:adjustments` di toolbar → modal terbuka.
- Untuk setiap parameter di JRXML, ada input dengan tipe sesuai (number/date/checkbox/text).
- Modal title: "Report Parameters".
- Edit nilai → klik "Apply" → modal close + report rerender dengan nilai baru.
- Klik "Cancel" / X → modal close tanpa apply.
- Klik "Reset" → semua nilai ke null (atau default kalau punya `defaultExpression`).
- Test dengan `public/jrxml/invoice.jrxml`: ubah parameter `companyName` → klik Apply → text "Acme Studio" di canvas berubah.

### Caveat
- **Date class detection** sederhana: pakai substring `'date'` di class name. JRXML class biasanya `java.util.Date` atau `java.sql.Date`. Untuk `java.time.LocalDate` juga di-cover karena ada substring `date`. Good enough untuk MVP.
- **Locale-aware date input** belum di-handle. Browser pakai locale-nya sendiri untuk `<input type="date">`.
- Bootstrap modal pakai `bs-dismiss` attribute untuk close — jangan ubah.
- Kalau pakai Modal class dari `bootstrap` import gagal, fallback: kasih `data-bs-toggle="modal"` + `data-bs-target` style attribute di tombol toolbar dan biarkan Bootstrap autoinit.

---

## Task 3 — Search Highlight

### Goal
User bisa search text di report → matches di-highlight di canvas, nav next/prev antar matches, count "1 of 5".

### Konteks
- Page boxes ada di `report.pages.value[i].boxes`. Boxes type `text` punya field `payload.text` atau `payload.lines`.
- Highlight = bisa dengan overlay `<mark>` di JrxmlBox text content, atau dengan box outline overlay di JrxmlPage.
- **Pilihan paling simple**: tambah ref reactive `searchQuery` di useJrxmlReport, JrxmlBox baca query dari injection/prop, render text dengan `<mark>` wrapping match.

### File yang Diubah/Dibuat
- **DIUBAH**: `app/composables/useJrxmlReport.ts` — tambah `searchQuery` + `searchMatches`
- **DIUBAH**: `app/components/report/JrxmlViewer.vue` — tambah search bar overlay + nav
- **DIUBAH**: `app/components/report/JrxmlPage.vue` — pass `searchQuery` prop ke JrxmlBox
- **DIUBAH**: `app/components/report/JrxmlBox.vue` — render text dengan highlight

### Steps

#### Step 3a — Tambah state di `useJrxmlReport.ts`

Setelah `const fontFactor = ref(1)`:

```ts
const searchQuery = ref('')
const currentMatchIndex = ref(0)

interface SearchHit {
  pageIndex: number  // 0-based
  boxIndex: number   // index dalam page.boxes
  text: string
}

const searchMatches = computed<SearchHit[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []
  pages.value.forEach((page, pi) => {
    page.boxes.forEach((box, bi) => {
      if (box.kind !== 'text') return
      const payload = box.payload as { text?: string; lines?: string[] }
      const text = (payload.lines?.join('\n') ?? payload.text ?? '').toLowerCase()
      if (text.includes(q)) hits.push({ pageIndex: pi, boxIndex: bi, text })
    })
  })
  return hits
})

function nextMatch() {
  if (!searchMatches.value.length) return
  currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
  jumpToCurrentMatch()
}

function prevMatch() {
  if (!searchMatches.value.length) return
  const n = searchMatches.value.length
  currentMatchIndex.value = (currentMatchIndex.value - 1 + n) % n
  jumpToCurrentMatch()
}

function jumpToCurrentMatch() {
  const hit = searchMatches.value[currentMatchIndex.value]
  if (!hit) return
  goto(hit.pageIndex + 1)
}
```

Tambah ke return statement:

```ts
return {
  // ... existing
  searchQuery, searchMatches, currentMatchIndex,
  nextMatch, prevMatch,
}
```

#### Step 3b — Search bar di toolbar

Di `JrxmlViewer.vue`, tambah tombol toolbar:

```vue
<button
  class="btn btn-icon btn-sm-custom"
  type="button"
  :aria-label="t('search')"
  :title="t('search')"
  @click="searchOpen = !searchOpen"
>
  <Icon name="tabler:search" />
</button>
```

Tambah search bar overlay setelah toolbar (atau di dalam canvas top):

```vue
<div v-if="searchOpen" class="jrxml-search-bar d-flex align-items-center gap-2 px-3 py-2 border-bottom bg-body">
  <Icon name="tabler:search" class="text-muted" />
  <input
    ref="searchInput"
    type="text"
    class="form-control form-control-sm jrxml-search-input"
    :placeholder="t('searchPlaceholder')"
    :value="report.searchQuery.value"
    @input="onSearchInput"
    @keydown.enter="report.nextMatch()"
    @keydown.escape="closeSearch"
  >
  <span class="small text-muted jrxml-search-count">
    {{ report.searchMatches.value.length === 0
        ? t('noMatches')
        : `${report.currentMatchIndex.value + 1} / ${report.searchMatches.value.length}` }}
  </span>
  <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('prevMatch')" :disabled="!report.searchMatches.value.length" @click="report.prevMatch()">
    <Icon name="tabler:chevron-up" />
  </button>
  <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('nextMatch')" :disabled="!report.searchMatches.value.length" @click="report.nextMatch()">
    <Icon name="tabler:chevron-down" />
  </button>
  <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('closeSearch')" @click="closeSearch">
    <Icon name="tabler:x" />
  </button>
</div>
```

Tambah di `<script setup>`:

```ts
import { ref, nextTick } from 'vue'

const searchOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

function onSearchInput(e: Event) {
  props.report.searchQuery.value = (e.target as HTMLInputElement).value
  props.report.currentMatchIndex.value = 0
}

function closeSearch() {
  searchOpen.value = false
  props.report.searchQuery.value = ''
}

watch(searchOpen, (open) => {
  if (open) {
    nextTick(() => searchInput.value?.focus())
  }
})
```

Tambah labels:

```ts
const labels = {
  // ...
  search: 'Search',
  searchPlaceholder: 'Find in report…',
  noMatches: 'No matches',
  prevMatch: 'Previous match',
  nextMatch: 'Next match',
  closeSearch: 'Close search',
}
```

Tambah CSS:

```css
.jrxml-search-input {
  max-width: 300px;
}
.jrxml-search-count {
  min-width: 60px;
  text-align: center;
}
```

**Ctrl+F shortcut**: tambah ke handler `onKeyDown`:

```ts
case 'f':
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    searchOpen.value = true
  }
  break
```

#### Step 3c — Highlight di `JrxmlPage.vue`

Pass `searchQuery` ke `JrxmlBox`:

```vue
<JrxmlBox v-for="(box, i) in page.boxes" :key="i" :box="box" :font-factor="fontFactor" :search-query="searchQuery" />
```

Tambah prop:

```ts
const props = defineProps<{ page: Page; zoom?: number; fontFactor?: number; searchQuery?: string }>()
```

#### Step 3d — Highlight di `JrxmlBox.vue`

Tambah prop:

```ts
const props = defineProps<{ box: PositionedBox; fontFactor?: number; searchQuery?: string }>()
```

Ganti template untuk text box:

```vue
<div v-if="box.kind === 'text'" class="jrxml-box jrxml-text" :style="textStyle">
  <div class="jrxml-text-inner" :style="innerStyle">
    <template v-for="(line, i) in lines" :key="i">
      <span v-html="highlightLine(line)" />
      <br v-if="i < lines.length - 1">
    </template>
  </div>
</div>
```

Tambah method:

```ts
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightLine(line: string): string {
  const q = props.searchQuery?.trim()
  if (!q) return escapeHtml(line)
  const re = new RegExp(`(${escapeRegExp(q)})`, 'gi')
  return escapeHtml(line).replace(re, '<mark class="jrxml-highlight">$1</mark>')
}
```

Tambah CSS di `<style scoped>`:

```css
.jrxml-highlight {
  background: #fff59d;
  color: inherit;
  padding: 0;
  border-radius: 2px;
}
```

Pass `:search-query` di nested JrxmlBox (untuk frame children):

```vue
<JrxmlBox
  v-for="(child, i) in (box.payload as FramePayload).children"
  :key="i"
  :box="child"
  :font-factor="fontFactor"
  :search-query="searchQuery"
/>
```

### Acceptance
- Klik icon search di toolbar → search bar muncul di bawah toolbar.
- Ketik "invoice" → semua occurrence "invoice" / "Invoice" di canvas ter-highlight kuning.
- Counter di kanan input: "1 / 3" (atau berapa total).
- Klik panah bawah → ke match berikutnya, page auto-jump kalau match di page lain.
- Klik panah atas → ke previous match.
- Tekan Esc di input → search bar close, highlight hilang.
- Tekan Enter di input → ke match berikutnya.
- Ctrl+F: search bar terbuka + input fokus otomatis.
- Search case-insensitive: "INVOICE" cocok dengan "Invoice".

### Caveat
- **`v-html` security**: input user di-escape pakai `escapeHtml` sebelum di-wrap `<mark>`. **Jangan** skip escape — XSS risk.
- **Frame nested**: pastikan prop `:search-query` di-pass ke `<JrxmlBox v-for>` di dalam frame, kalau tidak text di frame nggak ke-highlight.
- **Performance**: untuk report 1000+ box, `searchMatches` computed di-trigger setiap keystroke. Kalau lambat, tambah `useDebounceFn` dari `@vueuse/core`:

  ```ts
  import { useDebounceFn } from '@vueuse/core'
  const setSearchQuery = useDebounceFn((v: string) => {
    props.report.searchQuery.value = v
  }, 200)
  ```

  Pakai di `onSearchInput` instead of langsung set.
- **Jangan auto-scroll** ke match-nya. `goto(page)` saja cukup untuk MVP. Auto-scroll dalam page = task terpisah.

---

## Definition of Done (Fase 5 Toolbar)

Semua harus selesai:
- [ ] Task 1: Font size slider di dropdown toolbar, real-time apply, range 50–200%
- [ ] Task 2: Parameters dialog modal, dynamic form by type, Apply triggers rerender
- [ ] Task 3: Search highlight dengan nav next/prev, Ctrl+F shortcut

**Verifikasi end-to-end**:
1. `pnpm dev`
2. Buka `/report/invoice`
3. Klik typography icon → drag slider → font berubah
4. Klik adjustments icon → modal terbuka → ubah `companyName` → Apply → text di canvas berubah
5. Klik search icon (atau Ctrl+F) → ketik "Invoice" → matches highlighted, counter "1 of 2"
6. Klik next match → page bisa jump kalau match di page beda
7. Esc → search tutup, highlight hilang
8. `pnpm build` → tidak ada error TypeScript

---

## Tips untuk Junior / AI Murah

1. **Kerjakan task 1 dulu** — paling simple, jadi pemanasan.
2. **Task 2 (modal) lebih kompleks** — Bootstrap modal API butuh dynamic import. Kalau bingung, baca docs Bootstrap 5 Modal: https://getbootstrap.com/docs/5.3/components/modal/
3. **Task 3 (search) paling panjang** — pecah jadi 4 substep (3a–3d). Test setelah tiap substep, jangan tumpuk.
4. **Setelah tiap task selesai**, commit:
   ```
   git add -A
   git commit -m "feat(jrxml): add font size slider"
   ```
5. **Jangan modify file lain selain yang disebut "File yang Diubah"** — kalau perlu ubah file lain, baca konteks dulu.
6. **Jangan tambah library baru** kecuali instruksi explicit. `@vueuse/core`, `bootstrap`, Tabler icons sudah cukup.
7. **Kalau stuck > 30 menit**, periksa:
   - Apakah `useJrxmlReport` return value lengkap?
   - Apakah prop di-pass dari parent ke child?
   - Apakah ref di-unwrap dengan `.value` (di script) atau auto-unwrap (di template)?
8. **Test di Chrome + Firefox** — Bootstrap modal behavior kadang beda di Safari, skip Safari kalau nggak punya Mac.

---

## Hal yang **Bukan** Scope Issue Ini

Skip dulu, akan ditangani di issue terpisah:
- **Bookmarks panel** — depends on group bands (Fase 4 belum complete)
- **Group bands** (groupHeader/groupFooter) — feature besar tersendiri
- **Auto-scroll ke search match dalam page** — current MVP cuma jump ke page, scroll = nice-to-have
- **Regex search** — current cuma plain substring
- **Search "whole word" / "match case" options** — overkill untuk MVP
- **Subreport** — beyond library scope
- **Chart element** — beyond library scope

---

## Pasca Task — Re-baca Dependencies

Setelah 3 task selesai, **wajib baca ulang** dan pastikan:
- `useJrxmlReport.ts` return statement include `searchQuery`, `searchMatches`, `currentMatchIndex`, `nextMatch`, `prevMatch`
- TypeScript type `JrxmlReport = ReturnType<typeof useJrxmlReport>` otomatis include new returns — confirm di `JrxmlViewer.vue` bisa akses `report.searchQuery.value` tanpa error
- Build prod (`pnpm build`) lulus — kalau ada TS error di file render/* atau lib lain, **jangan disentuh**; itu out of scope. Tapi kalau error di file yang baru diubah → fix.
