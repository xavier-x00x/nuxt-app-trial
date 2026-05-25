# JRXML Viewer — Fase 4: Group Bands

> **Target pembaca**: junior programmer atau AI model yang lebih murah (Haiku/Sonnet/setara).
> **Bahasa**: instruksi pakai Bahasa Indonesia. Code dan technical terms tetap English.
> **Prasyarat**: Fase 1–6 sudah jalan. Fase 5 (toolbar features) dan Fase 7 (polish) boleh belum.
> **Asumsi**: pembaca paham Vue 3 Composition API, TypeScript, pure JS algorithms (loop, sort, find).

---

## Konteks Project

Library JRXML Viewer di-build di dalam Nuxt project ini. Plan lengkap: `/home/noto/.claude/plans/saya-ingin-membuat-library-keen-koala.md`.

**Status saat ini terkait groups**:
- ✓ Parser ([app/lib/jrxml/normalizer.ts:303-314](app/lib/jrxml/normalizer.ts#L303-L314)) sudah baca `<group>` dari XML → `JrGroup[]` di `report.value.groups`.
- ✓ Type `JrGroup` ([app/lib/jrxml/types.ts:138-146](app/lib/jrxml/types.ts#L138-L146)) lengkap: `name`, `expression`, `isStartNewPage`, `isReprintHeaderOnEachPage`, `keepTogether`, `groupHeader?`, `groupFooter?`.
- ✓ Variable `resetType=Group` dan `resetGroup` sudah ada di type `JrVariable`.
- ✗ **Paginator** ([app/lib/jrxml/paginator.ts](app/lib/jrxml/paginator.ts)) belum handle group sama sekali:
  - Tidak ada break detection
  - `groupHeader` / `groupFooter` tidak pernah di-emit
  - Variable `resetType=Group` di-treat sama seperti Report (nggak reset per group)

Issue ini implementasi **engine groups lengkap**. Setelah ini, report dengan group SUM per kategori akan jalan benar.

---

## Tujuan Fase 4

Lengkapi paginator agar support multi-level groups dengan semantik mendekati JasperReports.

| Task | Goal | Estimasi |
|---|---|---|
| 1 | Group break detection + emit groupHeader/groupFooter (single & multi-level) | 2.5 jam |
| 2 | Group-scoped variables (Sum/Count/etc dengan `resetType=Group`) | 1.5 jam |
| 3 | Group flags: `keepTogether`, `isReprintHeaderOnEachPage`, `isStartNewPage` | 1.5 jam |
| 4 | Tambah sample JRXML grouped untuk verifikasi visual | 30 menit |

**Total estimasi**: ±6 jam junior, ±2.5 jam AI.

---

## Konsep Dasar (Wajib Paham Sebelum Coding)

### Apa itu "Group" di JasperReports?

**Group** = mekanisme grouping baris data berdasarkan ekspresi key. Mirip `GROUP BY` di SQL, tapi tetap render semua row.

Contoh: invoice dengan field `category`. Group `categoryGroup` dengan `expression = $F{category}`.

- Data: 5 rows: `[A1, A2, B1, B2, B3]` (huruf = category).
- Tanpa group: cuma 5 detail row berturut-turut.
- Dengan group:
  ```
  [groupHeader: A]
    [detail A1]
    [detail A2]
  [groupFooter: A]   ← bisa berisi subtotal
  [groupHeader: B]
    [detail B1]
    [detail B2]
    [detail B3]
  [groupFooter: B]
  ```

### Break Detection

"Break" terjadi saat **nilai expression group beda dari row sebelumnya**.

Algoritma:
1. Track `lastGroupValues: Record<groupName, unknown>` per group.
2. Untuk setiap row baru, evaluate `group.expression` dengan context row tsb.
3. Bandingkan dengan `lastGroupValues[group.name]`.
4. Kalau beda → "break" untuk group ini DAN semua group nested di dalamnya.
5. Saat break: emit `groupFooter` dari yang **terdalam ke terluar** (reverse order), lalu emit `groupHeader` baru dari **terluar ke terdalam** (normal order).

### Multi-level

Group order matters. Group pertama di XML = outermost. Contoh: `[regionGroup, categoryGroup]`:
- Region break → category juga ikut break (cascade).
- Category break saja → region tidak break.

### Group-scoped Variable

Variable dengan `resetType="Group"` + `resetGroup="categoryGroup"`:
- Reset ke initial value (atau 0 untuk Sum) saat group break.
- Akumulasi per row di dalam group.
- Saat group footer di-emit, pakai final value untuk subtotal.

---

## Cara Verifikasi Sebelum Mulai

```bash
cd /home/noto/projects/webdev/nuxt-app-trial
pnpm dev
```

Buka report apa saja yang sudah jalan (mis. `/report/invoice`). Pastikan render normal.

**Baca file ini secara lengkap dulu sebelum coding**:
- [app/lib/jrxml/types.ts](app/lib/jrxml/types.ts) — focus type `JrGroup`, `JrVariable`, `JrBand`
- [app/lib/jrxml/paginator.ts](app/lib/jrxml/paginator.ts) — algoritma current
- [app/lib/jrxml/normalizer.ts](app/lib/jrxml/normalizer.ts#L303-L314) — bagaimana group di-parse
- [app/lib/jrxml/expr/evaluator.ts](app/lib/jrxml/expr/evaluator.ts) — fungsi `evalExpression`

---

## Task 1 — Group Break Detection + Emit Bands

### Goal
Paginator deteksi group break per row dan emit `groupHeader` / `groupFooter` di posisi yang benar. Support multi-level (nested groups).

### File yang Dibuat / Diubah
- **BARU**: `app/lib/jrxml/groups.ts` — helper functions
- **DIUBAH**: `app/lib/jrxml/paginator.ts` — refactor main loop

### Steps

#### Step 1a — Buat `app/lib/jrxml/groups.ts`

```ts
import type { JrGroup, JrReport } from './types'
import { evalExpression } from './expr/evaluator'
import type { LayoutContext } from './layout/band'

export interface GroupState {
  /** Last evaluated value per group name. `undefined` = belum pernah di-evaluate (first row). */
  values: Record<string, unknown>
  /** Number of rows processed since last break per group. Reset on break. */
  rowCounts: Record<string, number>
}

export function createGroupState(groups: JrGroup[]): GroupState {
  const values: Record<string, unknown> = {}
  const rowCounts: Record<string, number> = {}
  for (const g of groups) {
    values[g.name] = undefined
    rowCounts[g.name] = 0
  }
  return { values, rowCounts }
}

/**
 * Detect breaks untuk row baru. Return list group yang break, dari outer→inner.
 * Cascade: kalau group ke-N break, semua group setelahnya (N+1, N+2, ...) ikut break.
 */
export function detectBreaks(
  groups: JrGroup[],
  row: Record<string, unknown>,
  state: GroupState,
  parameters: Record<string, unknown>,
): { broken: JrGroup[]; newValues: Record<string, unknown> } {
  const newValues: Record<string, unknown> = {}
  for (const g of groups) {
    const ctx: LayoutContext = { fields: row, params: parameters, variables: {} }
    try {
      newValues[g.name] = evalExpression(g.expression, ctx)
    } catch {
      newValues[g.name] = null
    }
  }

  const broken: JrGroup[] = []
  let cascade = false
  for (const g of groups) {
    const prev = state.values[g.name]
    const next = newValues[g.name]
    // first row → always break (kick off first group)
    const isFirstRow = prev === undefined
    const valueChanged = !shallowEqual(prev, next)
    if (cascade || isFirstRow || valueChanged) {
      broken.push(g)
      cascade = true
    }
  }
  return { broken, newValues }
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  // Date instances
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return false
}

/**
 * Pakai untuk emit groupFooter saat semua row sudah selesai diproses.
 * Return groups dalam reverse order (inner→outer) yang punya state aktif.
 */
export function flushAllGroups(groups: JrGroup[], state: GroupState): JrGroup[] {
  const flushed: JrGroup[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]
    if (!g) continue
    if (state.values[g.name] !== undefined) flushed.push(g)
  }
  return flushed
}

/**
 * Index group by name. Helper untuk lookup variable resetGroup.
 */
export function indexGroupsByName(report: JrReport): Map<string, JrGroup> {
  const m = new Map<string, JrGroup>()
  for (const g of report.groups) m.set(g.name, g)
  return m
}
```

#### Step 1b — Refactor `paginator.ts`

Ini bagian paling kompleks. Algoritma baru:

```ts
// Pseudocode flow:
// 1. Init groupState dari report.groups
// 2. Untuk setiap row:
//    a. detectBreaks → daftar group yang break
//    b. Untuk setiap broken group (reverse order): emit groupFooter (kalau bukan first occurrence)
//    c. Update state.values dengan newValues
//    d. Untuk setiap broken group (forward order): emit groupHeader
//    e. Emit detail row
// 3. Setelah semua row: flushAllGroups → emit semua remaining groupFooter
// 4. Emit summary
```

**Detail steps untuk modifikasi `paginate()` function**:

1. Import dari `groups.ts`:
   ```ts
   import { createGroupState, detectBreaks, flushAllGroups } from './groups'
   ```

2. Ganti struktur `DetailEntry` jadi `BandEntry` yang lebih umum:
   ```ts
   interface BandEntry {
     band: JrBand
     row: Record<string, unknown>
     rowIdx: number  // 0-based untuk REPORT_COUNT
     height: number
   }
   ```

3. Replace blok build `detailEntries` (line 99-106 paginator current) dengan flow group-aware:

   ```ts
   const entries: BandEntry[] = []
   const groupState = createGroupState(report.groups)

   rows.forEach((row, rowIdx) => {
     const { broken, newValues } = detectBreaks(report.groups, row, groupState, parameters)

     // Emit footer untuk group lama (reverse: inner → outer)
     for (let i = broken.length - 1; i >= 0; i--) {
       const g = broken[i]!
       // skip footer untuk first occurrence (belum ada data sebelumnya)
       if (groupState.values[g.name] === undefined) continue
       if (g.groupFooter) {
         const footerRow = { ...row, [`__group_${g.name}_value`]: groupState.values[g.name] }
         const ctx = buildCtx(rowIdx + 1, footerRow)
         const laid = layoutBand(g.groupFooter, ctx)
         entries.push({ band: g.groupFooter, row: footerRow, rowIdx, height: laid.height })
       }
     }

     // Update state.values
     for (const g of report.groups) groupState.values[g.name] = newValues[g.name]

     // Emit header untuk group baru (forward: outer → inner)
     for (const g of broken) {
       if (g.groupHeader) {
         const ctx = buildCtx(rowIdx + 1, row)
         const laid = layoutBand(g.groupHeader, ctx)
         entries.push({
           band: g.groupHeader,
           row,
           rowIdx,
           height: laid.height,
         })
       }
     }

     // Emit detail band(s)
     for (const band of report.bands.detail) {
       const ctx = buildCtx(rowIdx + 1, row)
       const laid = layoutBand(band, ctx)
       entries.push({ band, row, rowIdx, height: laid.height })
     }
   })

   // Flush remaining group footers (inner → outer)
   const flushedGroups = flushAllGroups(report.groups, groupState)
   for (const g of flushedGroups) {
     if (g.groupFooter) {
       const footerRow = { ...summaryRow, [`__group_${g.name}_value`]: groupState.values[g.name] }
       const ctx = buildCtx(rows.length, footerRow)
       const laid = layoutBand(g.groupFooter, ctx)
       entries.push({ band: g.groupFooter, row: footerRow, rowIdx: rows.length - 1, height: laid.height })
     }
   }
   ```

4. Ganti loop `for (const entry of detailEntries)` jadi `for (const entry of entries)` — pakai struktur yang sama, cuma sekarang `entries` include groupHeader/Footer juga.

5. Ganti `currentDetails: DetailEntry[]` jadi `currentEntries: BandEntry[]`.

6. Update emit dalam page loop:
   ```ts
   for (const entry of details) {
     emit(entry.band, entry.rowIdx + 1, entry.row)
   }
   ```
   Tetap sama, karena `BandEntry` punya field yang sama.

### Acceptance
- Buat sample JRXML dengan field `category` dan group `categoryGroup` (lihat Task 4 untuk template).
- Data: rows campur category A & B.
- Render: di canvas tampil `[groupHeader A] → [A1] → [A2] → [groupFooter A] → [groupHeader B] → [B1] → ...`.
- Tidak ada `groupFooter` sebelum baris pertama (first occurrence).
- Setelah row terakhir, `groupFooter` terakhir tetap di-emit.

### Caveat
- **Kalau group nggak punya `groupHeader` atau `groupFooter`**, skip emit-nya (check `if (g.groupHeader)` / `if (g.groupFooter)`).
- **`shallowEqual` simple** — cukup untuk number/string/boolean/null. Untuk object/array, evaluator sudah evaluate expression jadi primitive, jadi nggak masalah.
- **`groupState.values[name] === undefined`** untuk detect "first ever occurrence" — itu sebabnya `createGroupState` init dengan `undefined` bukan `null`.
- **Jangan ubah signature `paginate()`** — output tetap `Page[]`.
- Kalau test report **tanpa group**, harus tetap render normal (groups array kosong = entries = detail row saja).

---

## Task 2 — Group-Scoped Variables

### Goal
Variable dengan `resetType="Group"` (mis. `subtotal` Sum of `$F{price}` reset per category) compute benar dan available di `groupFooter` lewat `$V{subtotal}`.

### File yang Diubah
- `app/lib/jrxml/paginator.ts`

### Steps

1. **Tambah helper** untuk compute variable per group range:

   ```ts
   function computeGroupVariable(
     v: JrVariable,
     rowsInGroup: Record<string, unknown>[],
     parameters: Record<string, unknown>,
   ): unknown {
     // Reuse logic dari computeReportVariable() tapi dengan rows yang sudah di-filter per group
     return computeReportVariable(v, rowsInGroup, parameters)
   }
   ```

   (`computeReportVariable` sudah ada di paginator.ts.)

2. **Track row indices per group** saat iterate. Tambah di `groupState`:

   ```ts
   // Di groups.ts, perluas GroupState:
   export interface GroupState {
     values: Record<string, unknown>
     rowCounts: Record<string, number>
     /** Indices of rows yang masuk current open group, per group name. Reset on break. */
     rowIndices: Record<string, number[]>
   }
   ```

   Init: `rowIndices[g.name] = []` di `createGroupState`.

3. **Saat row baru di-process di paginator**, sebelum emit detail, push `rowIdx` ke `rowIndices` untuk semua group yang currently open:

   ```ts
   for (const g of report.groups) {
     groupState.rowIndices[g.name].push(rowIdx)
   }
   ```

4. **Saat group break**, sebelum reset, **compute variables yang reset di group ini**:

   ```ts
   // Sebelum reset state untuk group g yang break:
   const rowsInGroup = groupState.rowIndices[g.name].map(i => rows[i]!)
   const groupVars: Record<string, unknown> = {}
   for (const v of report.variables) {
     if (v.resetType === 'Group' && v.resetGroup === g.name) {
       groupVars[v.name] = computeGroupVariable(v, rowsInGroup, parameters)
     }
   }
   // Inject groupVars ke context saat emit groupFooter:
   ```

5. **Modify `buildCtx`** untuk accept group variables. Atau pakai pendekatan lain: simpan groupVars di `BandEntry.row` dengan key khusus dan unpack di `buildCtx`. Cleaner alternative — perluas `BandEntry`:

   ```ts
   interface BandEntry {
     band: JrBand
     row: Record<string, unknown>
     rowIdx: number
     height: number
     /** Extra variables yang merge ke ctx saat emit band ini. */
     extraVars?: Record<string, unknown>
   }
   ```

   Lalu di `buildCtx`:

   ```ts
   const buildCtx = (
     rowIdx: number,
     row: Record<string, unknown>,
     pageVars: Record<string, unknown> = {},
     extraVars: Record<string, unknown> = {},
   ): LayoutContext => ({
     fields: row,
     params: parameters,
     variables: { ...reportVars, REPORT_COUNT: rowIdx, ...pageVars, ...extraVars },
   })
   ```

   Pass `entry.extraVars` saat emit:

   ```ts
   const emit = (band, rowIdx, row, extraVars = {}) => {
     const ctx = buildCtx(rowIdx, row, pageVars, extraVars)
     // ...
   }
   // ... di loop:
   emit(entry.band, entry.rowIdx + 1, entry.row, entry.extraVars)
   ```

6. **Saat group break (footer emit)** — push entry dengan `extraVars: groupVars`:

   ```ts
   entries.push({
     band: g.groupFooter,
     row: ...,
     rowIdx,
     height: ...,
     extraVars: groupVars,  // ← penting
   })
   ```

7. **Reset `rowIndices[g.name]` setelah break**:

   ```ts
   groupState.rowIndices[g.name] = []
   ```

### Acceptance
- Sample JRXML dengan group `categoryGroup` + variable `categorySubtotal` (Sum of `$F{price}`, resetType=Group, resetGroup=categoryGroup).
- `groupFooter` berisi textField `$V{categorySubtotal}`.
- Hasil render: subtotal per kategori benar (mis. category A: 1000+1800=2800, category B: 350).
- Sum global di summary (resetType=Report) tetap 1000+1800+350=3150.

### Caveat
- **Variable `Page`-scoped** (resetType=Page): tidak di-cover di issue ini. Skip.
- **Initial value expression** (`initialValueExpression`): mostly digunakan untuk increment-only. Untuk Sum/Count, default 0. Skip evaluasi initialValueExpression — `computeReportVariable` sudah handle dengan reduce from 0.
- **Saat ada banyak group level**, variable resetGroup="innerGroup" reset lebih sering daripada "outerGroup". `rowsInGroup` berbeda. Pastikan filter rowIndices benar per group.

---

## Task 3 — Group Flags

### Goal
Hormati 3 flag di `JrGroup`:
1. **`isStartNewPage`** — sebelum emit groupHeader, force page break.
2. **`isReprintHeaderOnEachPage`** — saat page break terjadi di tengah group, re-emit groupHeader di awal page baru.
3. **`keepTogether`** — kalau groupHeader + minimal 1 detail row nggak muat di sisa halaman, force break sebelum emit groupHeader.

### File yang Diubah
- `app/lib/jrxml/paginator.ts`
- `app/lib/jrxml/groups.ts` (maybe add helpers)

### Steps

#### Flag 1: `isStartNewPage`

Saat `BandEntry` adalah groupHeader, check group flag:

1. **Tag BandEntry** dengan group reference (kalau dari groupHeader):
   ```ts
   interface BandEntry {
     // ... existing
     /** Reference ke JrGroup kalau ini groupHeader. */
     groupHeaderOf?: JrGroup
     /** Reference ke JrGroup kalau ini groupFooter. */
     groupFooterOf?: JrGroup
   }
   ```

2. Saat process page (loop yang flush ke `pagesContent`), sebelum push entry ke `currentEntries`:
   ```ts
   if (entry.groupHeaderOf?.isStartNewPage && currentEntries.length > 0) {
     pagesContent.push(currentEntries)
     currentEntries = []
     cursorY = printableTop + pageHeaderH + colHeaderH
   }
   ```

#### Flag 2: `isReprintHeaderOnEachPage`

Track currently-active group headers. Saat page break, re-emit headers yang aktif di awal page baru.

1. **Tambah state**: `let activeGroupHeaders: BandEntry[] = []`.

2. Saat emit groupHeader entry → tambah ke `activeGroupHeaders`:
   ```ts
   if (entry.groupHeaderOf) {
     // Replace existing header at same level
     activeGroupHeaders = activeGroupHeaders.filter(e => {
       const lvl = report.groups.indexOf(e.groupHeaderOf!)
       const newLvl = report.groups.indexOf(entry.groupHeaderOf!)
       return lvl < newLvl  // keep only outer headers
     })
     activeGroupHeaders.push(entry)
   }
   ```

3. Saat groupFooter di-emit → remove header at same level from `activeGroupHeaders`:
   ```ts
   if (entry.groupFooterOf) {
     activeGroupHeaders = activeGroupHeaders.filter(e => e.groupHeaderOf !== entry.groupFooterOf)
   }
   ```

4. **Saat page break terjadi** (pagesContent.push), re-prepend `activeGroupHeaders` ke `currentEntries` yang baru — tapi **filter** hanya yang punya `isReprintHeaderOnEachPage=true`:
   ```ts
   const toReprint = activeGroupHeaders.filter(e => e.groupHeaderOf?.isReprintHeaderOnEachPage)
   currentEntries.unshift(...toReprint)
   cursorY += toReprint.reduce((s, e) => s + e.height, 0)
   ```

#### Flag 3: `keepTogether`

Sebelum emit groupHeader yang `keepTogether=true`, pre-measure groupHeader height + 1 detail height. Kalau total > remaining space → force page break.

1. Cari posisi yang process entry di-add ke `currentEntries`. Tambah check:
   ```ts
   if (entry.groupHeaderOf?.keepTogether) {
     // estimate header + next detail height
     const nextDetailIdx = i + 1  // index dalam entries array
     const nextDetail = entries[nextDetailIdx]
     const lookaheadH = entry.height + (nextDetail?.height ?? 0)
     if (cursorY + lookaheadH > printableBottom - reservedBottom) {
       pagesContent.push(currentEntries)
       currentEntries = []
       cursorY = printableTop + pageHeaderH + colHeaderH
       // re-emit any reprint headers di sini juga
     }
   }
   ```

### Acceptance
- Sample JRXML dengan:
  - Group A: `isStartNewPage=true` → setiap value baru kategori = page baru.
  - Group B: `isReprintHeaderOnEachPage=true` → saat page break di tengah group B, header B tampil lagi di page baru.
  - Group C: `keepTogether=true` → header C + minimal 1 detail selalu di page yang sama (tidak akan ada header sendirian di bawah page).
- Test masing-masing di sample data secukupnya.

### Caveat
- **`isStartNewPage` di group pertama (first occurrence)** — bisa skip kalau current page kosong, jangan force break unnecessary blank page.
- **`isReprintHeaderOnEachPage` + `keepTogether`** kombinasi — keep together prioritas dulu.
- **Performance**: pre-measure setiap header keepTogether bisa lambat untuk report besar. OK untuk MVP, optimize nanti.

---

## Task 4 — Sample Grouped JRXML

### Goal
Buat sample template + data untuk test groups end-to-end.

### File yang Dibuat
- `public/jrxml/grouped-invoice.jrxml`
- `public/jrxml/grouped-invoice-data.json`
- `app/pages/report/grouped-invoice.vue`

### Steps

#### Step 4a — Template

`public/jrxml/grouped-invoice.jrxml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport name="GroupedInvoice" pageWidth="595" pageHeight="842"
  leftMargin="30" rightMargin="30" topMargin="30" bottomMargin="30"
  columnWidth="535">
  <field name="category" class="java.lang.String"/>
  <field name="description" class="java.lang.String"/>
  <field name="price" class="java.lang.Double"/>

  <variable name="categorySubtotal" class="java.lang.Double" calculation="Sum" resetType="Group" resetGroup="categoryGroup">
    <variableExpression><![CDATA[$F{price}]]></variableExpression>
  </variable>
  <variable name="grandTotal" class="java.lang.Double" calculation="Sum" resetType="Report">
    <variableExpression><![CDATA[$F{price}]]></variableExpression>
  </variable>

  <group name="categoryGroup" isReprintHeaderOnEachPage="true">
    <groupExpression><![CDATA[$F{category}]]></groupExpression>
    <groupHeader>
      <band height="20">
        <textField>
          <reportElement x="0" y="2" width="535" height="16" backcolor="#E0E0FF" mode="Opaque"/>
          <textElement textAlignment="Left" verticalAlignment="Middle">
            <font size="11" isBold="true"/>
          </textElement>
          <textFieldExpression><![CDATA["Category: " + $F{category}]]></textFieldExpression>
        </textField>
      </band>
    </groupHeader>
    <groupFooter>
      <band height="20">
        <staticText>
          <reportElement x="0" y="2" width="400" height="16"/>
          <textElement textAlignment="Right">
            <font size="10" isItalic="true"/>
          </textElement>
          <text><![CDATA[Subtotal:]]></text>
        </staticText>
        <textField>
          <reportElement x="400" y="2" width="135" height="16"/>
          <textElement textAlignment="Right">
            <font size="10" isBold="true"/>
          </textElement>
          <textFieldExpression><![CDATA[$V{categorySubtotal}]]></textFieldExpression>
        </textField>
      </band>
    </groupFooter>
  </group>

  <title>
    <band height="40">
      <staticText>
        <reportElement x="0" y="0" width="535" height="30"/>
        <textElement textAlignment="Center"><font size="18" isBold="true"/></textElement>
        <text><![CDATA[Grouped Invoice]]></text>
      </staticText>
    </band>
  </title>

  <columnHeader>
    <band height="20">
      <staticText><reportElement x="0" y="0" width="400" height="20"/><textElement><font isBold="true"/></textElement><text><![CDATA[Description]]></text></staticText>
      <staticText><reportElement x="400" y="0" width="135" height="20"/><textElement textAlignment="Right"><font isBold="true"/></textElement><text><![CDATA[Price]]></text></staticText>
    </band>
  </columnHeader>

  <detail>
    <band height="18">
      <textField>
        <reportElement x="0" y="0" width="400" height="18"/>
        <textFieldExpression><![CDATA[$F{description}]]></textFieldExpression>
      </textField>
      <textField>
        <reportElement x="400" y="0" width="135" height="18"/>
        <textElement textAlignment="Right"/>
        <textFieldExpression><![CDATA[$F{price}]]></textFieldExpression>
      </textField>
    </band>
  </detail>

  <summary>
    <band height="30">
      <staticText>
        <reportElement x="0" y="5" width="400" height="20"/>
        <textElement textAlignment="Right"><font isBold="true"/></textElement>
        <text><![CDATA[GRAND TOTAL:]]></text>
      </staticText>
      <textField>
        <reportElement x="400" y="5" width="135" height="20"/>
        <textElement textAlignment="Right"><font isBold="true" size="12"/></textElement>
        <textFieldExpression><![CDATA[$V{grandTotal}]]></textFieldExpression>
      </textField>
    </band>
  </summary>
</jasperReport>
```

#### Step 4b — Data

`public/jrxml/grouped-invoice-data.json`:

```json
{
  "parameters": {},
  "rows": [
    { "category": "Design", "description": "Logo design", "price": 500 },
    { "category": "Design", "description": "Banner design", "price": 300 },
    { "category": "Design", "description": "Business card", "price": 200 },
    { "category": "Development", "description": "Frontend setup", "price": 1500 },
    { "category": "Development", "description": "API integration", "price": 1200 },
    { "category": "Development", "description": "Bug fixes", "price": 400 },
    { "category": "Support", "description": "Training session", "price": 600 }
  ]
}
```

#### Step 4c — Page

`app/pages/report/grouped-invoice.vue`:

```vue
<script setup lang="ts">
definePageMeta({ layout: 'blank' })
const report = useJrxmlReport()
onMounted(async () => {
  const xml = await $fetch<string>('/jrxml/grouped-invoice.jrxml', { responseType: 'text' as never })
  const data = await $fetch<{ parameters: Record<string, unknown>; rows: Record<string, unknown>[] }>('/jrxml/grouped-invoice-data.json')
  report.loadXml(xml)
  report.setData(data.rows)
  report.setParameters(data.parameters)
  report.render()
})
</script>
<template>
  <ClientOnly>
    <JrxmlViewer :report="report" class="vh-100" />
  </ClientOnly>
</template>
```

#### Step 4d — Menu entry (optional)

Tambah ke `app/data/menus.json`:
```json
{ "label": "Grouped Invoice", "icon": "tabler:file-stack", "to": "/report/grouped-invoice" }
```

### Acceptance
- Buka `/report/grouped-invoice`.
- Tampil group header "Category: Design", 3 rows, subtotal 1000.
- Group header "Category: Development", 3 rows, subtotal 3100.
- Group header "Category: Support", 1 row, subtotal 600.
- Summary: GRAND TOTAL 4700.

---

## Definition of Done (Fase 4)

Semua harus selesai:
- [ ] Task 1: Group break detection + emit groupHeader/groupFooter (test pakai sample dari Task 4)
- [ ] Task 2: Variable resetType=Group benar (categorySubtotal per kategori)
- [ ] Task 3: 3 flag groups (isStartNewPage, isReprintHeaderOnEachPage, keepTogether) — test each manually
- [ ] Task 4: Sample template + data + page

**Verifikasi end-to-end**:
1. `pnpm dev`
2. Buka `/report/invoice` (sample lama tanpa group) — **harus tetap render normal** (regression test).
3. Buka `/report/grouped-invoice`:
   - Tampil group breaks dengan subtotal yang benar
   - Grand total benar
4. Edit `grouped-invoice.jrxml` → set `isStartNewPage="true"` di group → reload → setiap category mulai page baru
5. Test multi-page: tambah 50+ rows di JSON → pastikan `isReprintHeaderOnEachPage` jalan (kalau di-set di JRXML)
6. `pnpm build` → tidak ada TS error

---

## Tips untuk Junior / AI Murah

1. **Task 1 paling kritikal**. Selesaikan dulu sampai bisa render group dengan benar. Sisanya layer di atas.
2. **Pakai console.log generously** saat debug break detection. Track `groupState.values` per row. Hapus log setelah selesai.
3. **Test regression**: setelah Task 1, **buka `/report/invoice` (tanpa group)** dan pastikan masih render normal. Banyak refactor yang accidentally break non-grouped path.
4. **Jangan re-write seluruh `paginator.ts`** dari scratch. Pakai Edit tool dengan targeted replacements. Existing code structure (header/footer band emit, page footer at bottom) tetap dipertahankan.
5. **Commit per task**:
   ```
   git commit -m "feat(jrxml): add group break detection"
   git commit -m "feat(jrxml): add group-scoped variables"
   git commit -m "feat(jrxml): respect group keepTogether + reprintHeader flags"
   git commit -m "feat(jrxml): add grouped invoice sample"
   ```
6. **Kalau stuck > 1 jam di Task 1**, baca ulang section "Konsep Dasar" di atas. Salah model mental = bug yang susah cari.
7. **Test edge case**: data dengan 1 row only, data kosong, semua row same category, semua row different category, group nested 3 level.
8. **Jangan ubah `JrGroup`, `JrVariable`** types — sudah lengkap.

---

## Hal yang **Bukan** Scope Issue Ini

Skip dulu:
- **Bookmarks panel / sidebar UI** — tidak dibutuhkan. `Page.bookmarks` array tetap ada di type tapi diisi kosong (`[]`). Jangan habiskan waktu di sini.
- Variable `resetType="Page"` atau `"Column"` — out of scope.
- **`initialValueExpression`** evaluation — skip, pakai default 0 untuk Sum.
- **Subreport** — not in MVP.
- **Multi-column report** (`columnCount > 1`) — assume single column.
- **Group expressions complex** (multi-field tuple) — assume single field/value.
- **Group totals di export PDF/Excel/HTML** — `Page[]` sudah include groupHeader/Footer boxes, jadi auto-handled. Tapi Excel semantic export (issue Fase 6) saat ini fokus detail rows; group sections jadi merged rows. **Tidak perlu update Excel exporter di issue ini** — biarkan apa adanya.

---

## Pasca Implementasi — Update Documentation

Setelah selesai, update file plan utama `/home/noto/.claude/plans/saya-ingin-membuat-library-keen-koala.md` di section "Fase 4" → tandai sebagai DONE. Atau buat catatan di `CLAUDE.md` di root project (kalau ada) bahwa group bands sudah diimplementasi.
