# JRXML Viewer — Fase 7: Polish & Quality

> **Target pembaca**: junior programmer atau AI model yang lebih murah (Haiku/Sonnet/setara).
> **Bahasa**: instruksi pakai Bahasa Indonesia. Code dan technical terms tetap English.
> **Asumsi**: pembaca sudah familiar dengan Vue 3 Composition API, TypeScript dasar, dan Nuxt 4.

---

## Konteks Project

Library JRXML Viewer di-build di dalam Nuxt project ini sebagai bagian dari rencana di `/home/noto/.claude/plans/saya-ingin-membuat-library-keen-koala.md`. Tujuannya: render template JasperReports (`.jrxml`) di browser, mirip Stimulsoft Report Viewer.

**Status saat ini (Fase 1–6 selesai)**:
- Parser jrxml → AST → layout → paginate → Page[] → render Vue/PDF/Excel/HTML ✓
- Element types: textField, staticText, line, rectangle, image, frame, barcode ✓
- Expression evaluator (no `eval`), variable Sum/Avg/Count/dst ✓
- Toolbar minimal (Print + Save dropdown + Mode toggle) ✓
- Footer page nav + zoom ✓
- Export PDF (jsPDF), Excel (ExcelJS), HTML (standalone) ✓

**Yang belum selesai (di luar scope issue ini, tapi worth knowing)**:
- Group bands (groupHeader/groupFooter) — masih placeholder
- Bookmarks panel
- Parameters dialog
- Search highlight
- Font size slider

---

## Tujuan Fase 7

Polish kualitas + tambahkan baseline test agar library siap di-ekstrak jadi package terpisah nanti.

| Task | Goal | Estimasi |
|---|---|---|
| 1 | Loading skeleton saat XML/data masih di-fetch | 30 menit |
| 2 | Error boundary panel saat XML invalid atau render gagal | 30 menit |
| 3 | Dark mode chrome viewer (toolbar/footer dark) | 45 menit |
| 4 | Persist zoom + continuous mode ke `useStorage` | 30 menit |
| 5 | A11y baseline: `aria-label`, focus management, keyboard nav | 1 jam |
| 6 | Unit test minimal: `expr.spec.ts`, `paginator.spec.ts`, `variables.spec.ts` | 2 jam |

**Total estimasi**: ±5 jam kerja untuk dev junior, ±2 jam untuk AI.

---

## Cara Verifikasi Sebelum Mulai

Pastikan environment jalan dulu:

```bash
cd /home/noto/projects/webdev/nuxt-app-trial
pnpm dev
```

Buka `http://localhost:3000/report/invoice` (atau halaman report apa saja yang sudah ada di `app/pages/report/`). Pastikan viewer tampil, toolbar berfungsi (Print/Save/Mode), footer page nav jalan, dan export PDF/Excel/HTML men-trigger download.

Kalau ada yang error, **fix dulu** sebelum lanjut task di bawah. Jangan tumpuk masalah.

---

## Task 1 — Loading Skeleton

### Goal
Saat `report.load()` lagi fetch XML atau `report.render()` lagi memproses data, viewer harus tampilkan skeleton placeholder, bukan area kosong/blank.

### File yang Diubah
- `app/components/report/JrxmlViewer.vue`

### Steps

1. **Baca dulu** file `JrxmlViewer.vue` untuk lihat struktur saat ini.
2. Cari block `<div v-if="report.loading.value" ...>` di canvas — saat ini cuma spinner kecil dengan teks "Loading…".
3. Ganti dengan skeleton yang lebih substantial:

   ```vue
   <div v-if="report.loading.value" class="jrxml-skeleton-wrapper">
     <div class="jrxml-skeleton-page">
       <div class="skeleton-line skeleton-line-lg" style="width: 60%" />
       <div class="skeleton-line" style="width: 40%" />
       <div class="skeleton-spacer" />
       <div class="skeleton-line" style="width: 100%" v-for="i in 8" :key="i" />
     </div>
   </div>
   ```

4. Tambah CSS-nya di block `<style scoped>` di file yang sama:

   ```css
   .jrxml-skeleton-wrapper {
     display: flex;
     justify-content: center;
     padding: 24px;
   }
   .jrxml-skeleton-page {
     width: 595px;
     min-height: 842px;
     background: #fff;
     padding: 40px;
     box-shadow: 0 2px 8px rgba(0,0,0,.35);
   }
   .skeleton-line {
     height: 12px;
     background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
     background-size: 200% 100%;
     margin-bottom: 12px;
     border-radius: 4px;
     animation: skeleton-shimmer 1.5s infinite;
   }
   .skeleton-line-lg { height: 24px; }
   .skeleton-spacer { height: 24px; }
   @keyframes skeleton-shimmer {
     0% { background-position: 200% 0; }
     100% { background-position: -200% 0; }
   }
   ```

### Acceptance
- Buka `http://localhost:3000/report/invoice`. Sebelum data ke-load, harus tampil skeleton (bukan spinner kecil).
- Setelah selesai load, skeleton hilang dan report tampil normal.
- Resize browser: skeleton tetap di tengah canvas.

### Caveat
Jangan hapus `report.loading` ref di `useJrxmlReport.ts`. Ada kode yang dependent.

---

## Task 2 — Error Boundary Panel

### Goal
Saat XML invalid (parse error, exception di evaluator), tampilkan panel error besar di canvas dengan pesan + stack trace, bukan cuma alert kecil di atas.

### File yang Diubah
- `app/components/report/JrxmlViewer.vue`

### Steps

1. Saat ini error ditampilkan via `<div v-if="report.error.value" class="alert alert-danger ...">` di atas toolbar. Itu OK untuk minor error, tapi kalau report nggak ke-render sama sekali user lebih perlu panel besar.
2. Tambah block baru di area canvas, **sebelum** `<div v-else-if="visiblePages.length === 0" ...>`:

   ```vue
   <div v-else-if="report.error.value" class="jrxml-error-panel">
     <div class="jrxml-error-card">
       <Icon name="tabler:alert-triangle" class="jrxml-error-icon" />
       <h4>Report Error</h4>
       <p class="jrxml-error-message">{{ report.error.value }}</p>
       <button class="btn btn-sm btn-outline-secondary" @click="report.error.value = null">
         Dismiss
       </button>
     </div>
   </div>
   ```

3. Tambah CSS:

   ```css
   .jrxml-error-panel {
     display: flex;
     justify-content: center;
     align-items: center;
     height: 100%;
     padding: 24px;
   }
   .jrxml-error-card {
     max-width: 480px;
     padding: 32px;
     background: #fff;
     border-radius: 8px;
     box-shadow: 0 4px 16px rgba(0,0,0,.2);
     text-align: center;
   }
   .jrxml-error-icon {
     font-size: 48px;
     color: #d63939;
     margin-bottom: 16px;
   }
   .jrxml-error-message {
     color: #555;
     font-family: monospace;
     font-size: 12px;
     text-align: left;
     background: #f8f9fa;
     padding: 12px;
     border-radius: 4px;
     max-height: 200px;
     overflow: auto;
   }
   ```

4. **Hapus** atau **comment** block `<div v-if="report.error.value" class="alert alert-danger m-3" ...>` di atas toolbar — udah duplikat dengan panel baru.

### Acceptance
- Test dengan template rusak: ubah sementara `public/jrxml/invoice.jrxml`, hapus tag closing penting (misal `</jasperReport>`).
- Reload viewer → panel error besar harus tampil.
- Klik "Dismiss" → panel hilang, viewer kembali ke state empty (atau previous report kalau ada).
- Restore file template ke semula setelah selesai test.

### Caveat
Jangan throw exception baru di error panel — bisa infinite loop kalau Vue render gagal.

---

## Task 3 — Dark Mode Chrome Viewer

### Goal
Toolbar + footer + canvas background ikut Tabler `data-bs-theme="dark"` saat dark mode aktif. **Kertas tetap putih** (konvensi report viewer).

### File yang Diubah
- `app/components/report/JrxmlViewer.vue`
- `app/components/report/JrxmlPage.vue` (cuma pastikan kertas tidak ke-override)

### Steps

1. Baca `JrxmlViewer.vue` cari selector `.jrxml-viewer`. Saat ini background pakai `var(--tblr-bg-surface-secondary, #f8fafc)` — bagus karena variabel Tabler.
2. Cari `.jrxml-canvas` — saat ini hard-coded `background: #525659`. Itu memang sengaja (Stimulsoft style), tapi di dark mode bisa lebih dark. Update jadi:

   ```css
   .jrxml-canvas {
     overflow: auto;
     background: #525659;
   }
   :root[data-bs-theme="dark"] .jrxml-canvas {
     background: #2b2c2e;
   }
   ```

3. Toolbar dan footer pakai `bg-body` class Tabler yang sudah auto-adjust dark mode — biarkan apa adanya.
4. Cek di `JrxmlPage.vue`: `.jrxml-page { background: #fff; }`. Pastikan **tidak ada** override dark mode di sini.
5. Tambah test manual: buka browser DevTools → Elements → tambah `data-bs-theme="dark"` ke `<html>`. Viewer chrome harus jadi dark, kertas tetap putih.

### Acceptance
- Toggle dark mode via app (kalau ada toggle), atau set `<html data-bs-theme="dark">` manual.
- Toolbar text/icon readable di dark.
- Canvas background lebih gelap dari light mode.
- Kertas (`.jrxml-page`) **tetap putih** — ini penting.
- Toggle balik ke light mode: semua kembali normal.

### Caveat
Jangan pakai `prefers-color-scheme` media query — pakai class/attribute Tabler. Project ini punya theme toggle sendiri.

---

## Task 4 — Persist Zoom & Continuous Mode

### Goal
Saat user reload page, zoom level dan continuous/single page mode harus ter-restore dari preferensi sebelumnya. Pakai `useStorage` dari `@vueuse/core` (sudah ter-install).

### File yang Diubah
- `app/composables/useJrxmlReport.ts`

### Steps

1. Baca current state `useJrxmlReport.ts`. Saat ini:
   ```ts
   const zoom = ref(1)
   const continuous = ref(true)
   ```

2. Ganti dengan `useStorage`:
   ```ts
   import { useStorage } from '@vueuse/core'
   // ... di dalam useJrxmlReport():
   const zoom = useStorage('jrxml-viewer-zoom', 1)
   const continuous = useStorage('jrxml-viewer-continuous', true)
   ```

3. `useStorage` mengembalikan `Ref<T>` yang otomatis sync ke `localStorage`. API-nya kompatibel dengan `ref`, jadi tidak perlu ubah usage di tempat lain.
4. Pastikan key localStorage unik dan deskriptif (prefix `jrxml-viewer-`).

### Acceptance
- Buka viewer, set zoom ke 150%, switch ke single page mode.
- Reload page (F5).
- Zoom dan mode harus ter-restore.
- Test di DevTools → Application → Local Storage → ada `jrxml-viewer-zoom` dan `jrxml-viewer-continuous`.

### Caveat
- `useStorage` di SSR (server-side) bisa kasih warning karena `localStorage` nggak ada. Karena viewer sudah `<ClientOnly>` di parent, ini aman. Tapi kalau ada warning, wrap import-nya.
- **Jangan** persist `currentPage` — user nggak expect halaman 5 ke-restore saat reload.

---

## Task 5 — A11y Baseline

### Goal
Tambah `aria-label`, keyboard support, dan focus management baseline supaya screen reader dan keyboard user bisa pakai viewer.

### File yang Diubah
- `app/components/report/JrxmlViewer.vue`

### Steps

1. **Aria-label di semua icon button**. Saat ini banyak `<button class="btn btn-icon">` cuma berisi `<Icon>` tanpa label. Screen reader bingung. Tambah `aria-label`:

   ```vue
   <button
     class="btn btn-icon btn-sm-custom"
     type="button"
     :aria-label="t('print')"
     :title="t('print')"
     @click="report.print()"
   >
     <Icon name="tabler:printer" />
   </button>
   ```

   Lakukan untuk **semua** icon button di toolbar dan footer (Print, Save, Mode dropdown trigger, page nav buttons, zoom in/out).

2. **Keyboard shortcuts**. Tambah `@keydown` listener di root viewer:

   ```vue
   <div class="jrxml-viewer d-flex flex-column" :class="$attrs.class" @keydown="onKeyDown" tabindex="0">
   ```

   Lalu di `<script setup>`:

   ```ts
   function onKeyDown(e: KeyboardEvent) {
     if (e.target instanceof HTMLInputElement) return  // jangan intercept saat ngetik di input
     switch (e.key) {
       case 'ArrowRight':
       case 'PageDown':
         e.preventDefault(); props.report.next(); break
       case 'ArrowLeft':
       case 'PageUp':
         e.preventDefault(); props.report.prev(); break
       case 'Home':
         e.preventDefault(); props.report.first(); break
       case 'End':
         e.preventDefault(); props.report.last(); break
       case '+':
       case '=':
         if (e.ctrlKey) { e.preventDefault(); props.report.zoomIn() }
         break
       case '-':
         if (e.ctrlKey) { e.preventDefault(); props.report.zoomOut() }
         break
     }
   }
   ```

3. **Role landmark** di canvas:
   ```vue
   <div class="jrxml-canvas flex-fill" role="main" aria-label="Report content">
   ```

4. **Focus outline**. Tambah CSS biar focus ring kelihatan:
   ```css
   .jrxml-viewer:focus { outline: none; }
   .jrxml-viewer .btn:focus-visible {
     outline: 2px solid var(--tblr-primary, #206bc4);
     outline-offset: 2px;
   }
   ```

### Acceptance
- Tab through viewer pakai keyboard — semua button reachable, focus ring kelihatan.
- Right arrow → next page; Left arrow → prev page; Home/End → first/last; Ctrl+Plus → zoom in.
- Screen reader (kalau ada): test pakai NVDA/VoiceOver, pastikan setiap button announce label.
- Klik input page number → ketik nomor → Enter. **Arrow keys tidak boleh** intercept saat di input (sudah di-handle dengan check `e.target instanceof HTMLInputElement`).

### Caveat
- Jangan over-engineer. Skip focus trap di dialog karena dialog belum diimplementasikan (itu Fase 5).
- Test keyboard di Chrome dan Firefox — behavior kadang beda.

---

## Task 6 — Unit Tests

### Goal
Pasang fondasi unit test di `tests/jrxml/` untuk komponen non-UI: expression evaluator, paginator, variables. Pakai **Vitest** (sudah ter-config Nuxt 4 default).

### File yang Dibuat
- `tests/jrxml/expr.spec.ts`
- `tests/jrxml/paginator.spec.ts`
- `tests/jrxml/variables.spec.ts`

### Steps

1. **Verifikasi vitest available**:
   ```bash
   pnpm vitest --version
   ```
   Kalau belum ada, install: `pnpm add -D vitest @vue/test-utils happy-dom`.

2. **Kalau belum ada `vitest.config.ts`**, buat di root:
   ```ts
   import { defineConfig } from 'vitest/config'
   import { fileURLToPath } from 'node:url'

   export default defineConfig({
     test: {
       environment: 'happy-dom',
       globals: true,
     },
     resolve: {
       alias: {
         '~': fileURLToPath(new URL('./app', import.meta.url)),
       },
     },
   })
   ```

3. **`tests/jrxml/expr.spec.ts`** — minimal 10 case:

   ```ts
   import { describe, it, expect } from 'vitest'
   import { evalExpression } from '~/lib/jrxml/expr/evaluator'

   const ctx = (fields = {}, params = {}, variables = {}) => ({ fields, params, variables })

   describe('expression evaluator', () => {
     it('evaluates number literal', () => {
       expect(evalExpression('42', ctx())).toBe(42)
     })
     it('evaluates string literal', () => {
       expect(evalExpression('"hello"', ctx())).toBe('hello')
     })
     it('resolves $F{name}', () => {
       expect(evalExpression('$F{name}', ctx({ name: 'Alice' }))).toBe('Alice')
     })
     it('resolves $P{title}', () => {
       expect(evalExpression('$P{title}', ctx({}, { title: 'Invoice' }))).toBe('Invoice')
     })
     it('resolves $V{count}', () => {
       expect(evalExpression('$V{count}', ctx({}, {}, { count: 5 }))).toBe(5)
     })
     it('handles string concatenation', () => {
       expect(evalExpression('"a" + "b"', ctx())).toBe('ab')
     })
     it('handles arithmetic', () => {
       expect(evalExpression('1 + 2 * 3', ctx())).toBe(7)
     })
     it('handles ternary', () => {
       expect(evalExpression('1 > 0 ? "yes" : "no"', ctx())).toBe('yes')
     })
     it('handles null field gracefully', () => {
       expect(() => evalExpression('$F{missing}', ctx())).not.toThrow()
     })
     it('handles parentheses precedence', () => {
       expect(evalExpression('(1 + 2) * 3', ctx())).toBe(9)
     })
   })
   ```

4. **`tests/jrxml/variables.spec.ts`** — test `computeReportVariable`:

   Karena fungsi ini tidak di-export, **export-kan dulu** di `paginator.ts`:
   ```ts
   // di paginator.ts, ubah `function computeReportVariable` jadi:
   export function computeReportVariable(...) { ... }
   ```

   Lalu test:
   ```ts
   import { describe, it, expect } from 'vitest'
   import { computeReportVariable } from '~/lib/jrxml/paginator'
   import type { JrVariable } from '~/lib/jrxml/types'

   const sumVar: JrVariable = {
     name: 'total',
     class: 'java.math.BigDecimal',
     calculation: 'Sum',
     resetType: 'Report',
     variableExpression: '$F{price}',
   }

   describe('variables', () => {
     it('sums numeric field', () => {
       const rows = [{ price: 10 }, { price: 20 }, { price: 30 }]
       expect(computeReportVariable(sumVar, rows, {})).toBe(60)
     })
     it('returns 0 for empty rows', () => {
       expect(computeReportVariable(sumVar, [], {})).toBe(0)
     })
     it('counts non-null values', () => {
       const countVar = { ...sumVar, calculation: 'Count' as const }
       const rows = [{ price: 10 }, { price: null }, { price: 30 }]
       expect(computeReportVariable(countVar, rows, {})).toBe(2)
     })
     it('finds highest', () => {
       const v = { ...sumVar, calculation: 'Highest' as const }
       expect(computeReportVariable(v, [{ price: 5 }, { price: 15 }, { price: 10 }], {})).toBe(15)
     })
     it('finds lowest', () => {
       const v = { ...sumVar, calculation: 'Lowest' as const }
       expect(computeReportVariable(v, [{ price: 5 }, { price: 15 }, { price: 10 }], {})).toBe(5)
     })
     // tambah 5 case lagi: Average, DistinctCount, First, dst.
   })
   ```

5. **`tests/jrxml/paginator.spec.ts`** — test pagination basic:

   ```ts
   import { describe, it, expect } from 'vitest'
   import { paginate } from '~/lib/jrxml/paginator'
   import type { JrReport } from '~/lib/jrxml/types'

   function minimalReport(): JrReport {
     return {
       name: 'test',
       pageWidth: 595, pageHeight: 842,
       margins: { top: 30, bottom: 30, left: 30, right: 30 },
       columnWidth: 535, columnSpacing: 0, columnCount: 1,
       orientation: 'Portrait',
       parameters: [], fields: [], variables: [], groups: [],
       bands: {
         detail: [{
           height: 50,
           splitType: 'Stretch',
           elements: [],
         }],
       },
     }
   }

   describe('paginator', () => {
     it('returns 1 page for empty rows', () => {
       const pages = paginate({ report: minimalReport(), rows: [], parameters: {} })
       expect(pages.length).toBeGreaterThanOrEqual(1)
     })
     it('all pages have width/height matching report', () => {
       const pages = paginate({ report: minimalReport(), rows: [{}, {}, {}], parameters: {} })
       expect(pages.every(p => p.width === 595 && p.height === 842)).toBe(true)
     })
     it('page index increments correctly', () => {
       const r = minimalReport()
       // bikin rows banyak agar paginate jadi multi-page
       const rows = Array.from({ length: 100 }, () => ({}))
       const pages = paginate({ report: r, rows, parameters: {} })
       pages.forEach((p, i) => expect(p.index).toBe(i + 1))
     })
     // tambah 7 case lagi: title page only, summary band, page footer position, dll.
   })
   ```

6. **Tambah script ke `package.json`**:
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```

7. **Jalankan**:
   ```bash
   pnpm test
   ```
   Semua 30+ test harus lulus. Kalau ada yang fail, **fix test atau fix code** — bukan skip test.

### Acceptance
- `pnpm test` lulus tanpa error.
- Coverage minimal 30 test case (10 per file).
- CI-friendly: tidak butuh browser, jalan di Node.

### Caveat
- Jangan test UI/Vue component di sini. Cukup logic murni. Component test = Fase berikutnya.
- Kalau `paginator.ts` tidak export `computeReportVariable`, kamu boleh duplikasi function-nya di test file, **tapi lebih baik export-kan**.

---

## Definition of Done (Fase 7)

Semua harus selesai:
- [ ] Task 1: Skeleton tampil saat loading
- [ ] Task 2: Error panel besar tampil saat error
- [ ] Task 3: Dark mode chrome bekerja, kertas tetap putih
- [ ] Task 4: Zoom + mode persist ke localStorage
- [ ] Task 5: Keyboard nav + aria-label di semua button
- [ ] Task 6: `pnpm test` lulus dengan minimal 30 case

**Verifikasi end-to-end**:
1. `pnpm dev`
2. Buka `/report/invoice`
3. Tab keyboard sampai ke button Save → trigger via Enter
4. Pakai arrow keys untuk page nav
5. Ctrl+Plus untuk zoom in
6. Toggle dark mode → chrome berubah, kertas tetap putih
7. Set zoom 200%, reload page → zoom kembali 200%
8. Test template rusak → panel error besar tampil
9. `pnpm test` di terminal → semua lulus

---

## Tips untuk Junior / AI Murah

1. **Baca dulu sebelum edit**. Setiap task list "File yang Diubah" — buka file itu, baca isinya, baru edit. Jangan asumsi struktur.
2. **Edit incremental**. Jangan rewrite seluruh file. Pakai `Edit` tool dengan `old_string` + `new_string` yang spesifik.
3. **Test setiap task selesai**. Jangan tumpuk 6 task lalu baru test — debugging-nya susah.
4. **Commit per task**. `git add` + `git commit -m "feat(jrxml): add loading skeleton"`. Atomic commits.
5. **Kalau stuck > 30 menit**, baca ulang plan utama di `/home/noto/.claude/plans/saya-ingin-membuat-library-keen-koala.md` untuk konteks lebih luas.
6. **Jangan tambah fitur baru**. Stick to scope yang ada di issue ini. Fitur lain (group bands, bookmarks, parameters dialog, search, font slider) ada di task list terpisah — bukan di sini.
7. **Tidak ada CSS-in-JS, tidak ada library tambahan**. Pakai Tabler CSS + Tabler icons (sudah ter-install). Library baru = tolak.

---

## Hal yang **Bukan** Scope Fase Ini

- Group bands (groupHeader/groupFooter rendering)
- Bookmarks sidebar
- Parameters dialog
- Search highlight
- Font size slider
- Subreport
- Chart element
- componentElement table
- Ellipse shape

Semua di atas akan dijadwalkan di issue terpisah setelah Fase 7 selesai.
