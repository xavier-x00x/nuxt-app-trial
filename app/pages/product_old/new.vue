<!-- eslint-disable vue/valid-v-model -->
<script setup lang="ts">
// import { useDebounce } from "@vueuse/core";
const title = "Create New Product";
const productCode = ref(""); // Add a ref for v-model
const tanggal = ref("");
const harga = ref("99999");
const harga2 = ref(0);
const objectData = ref<unknown>(null);
useHead({
  title: title,
});

const apiUrl = "http://localhost:3050/api/products/list";

const selectFormat = (item: Record<string, unknown>) => {
  return `${item.sku} - ${item.name} - Rp ${Number(
    item.price
  ).toLocaleString()}`;
};

const onSelected = (item: unknown) => {
  console.log(item);
  objectData.value = item;
};

const hargaRaw = (value: number) => {
  harga2.value = value;
};

const trans = ref({
  name: "Tempeh",
  daftar_harga: [
    {
      id: 1,
      harga: 10000,
      hargaRaw: 0,
    },
    {
      id: 2,
      harga: 20000,
      hargaRaw: 0,
    },
    {
      id: 3,
      harga: 30000,
      hargaRaw: 0,
    },
  ],
});

// Inisialisasi AutoNumeric untuk semua baris
// const initAutoNumeric = () => {
//   trans.value.daftar_harga.forEach((item) => {
//     if (item.hargaRef && !item.auto) {
//       item.auto = useAutoNumeric(item.hargaRef);
//     }
//   });
// };

const src = ref<string>("");
// const preview = ref<string>("");
const blob = ref<Blob | null>(null);
const lastBox = ref<{
  x: number;
  y: number;
  width: number;
  height: number;
} | null>(null);

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  src.value = url;
}

// function onExport(payload: { blob: Blob; dataUrl: string }) {
function onExport(payload: { blob: Blob }) {
  blob.value = payload.blob;
  console.log(blob.value);

  // preview.value = payload.dataUrl;
}

onMounted(() => {
  // initAutoNumeric();
});
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:package" />
    <PageBody>
      <div class="row justify-content-start">
        <div class="col-xl-2 col-md-6 col-sm-12">
          <div class="mb-2">
            <label class="form-label mb-1">Nama Produk</label>
            <input
              type="text"
              class="form-control rounded-1"
              name="name"
              placeholder="Input Nama Produk"
            />
          </div>
          <ui-input
            v-model="productCode"
            label="Kode Produk"
            type="text"
            placeholder="Input Kode Produk"
          />
          {{ objectData }}
          <div class="mb-2">
            <label class="form-label mb-1">Advanced select</label>
            <select class="form-select rounded-1" value="">
              <option value="1">Chuck Tesla</option>
              <option value="2">Elon Musk</option>
              <option value="3">Paweł Kuna</option>
              <option value="4">Nikola Tesla</option>
            </select>
          </div>
          <ui-date-picker v-model="tanggal" placeholder="Tanggal" />
          {{ tanggal }}
          <ui-input-number
            v-model="harga"
            label="Harga"
            :decimal="2"
            @data-raw="hargaRaw"
          />
          {{ harga2 }}
          <div class="mb-2">
            <label class="form-label mb-1">Advanced select</label>
            <ui-select-search
              v-model="productCode"
              xname="kd_brg"
              value-key="sku"
              placeholder="Input Kode Produk"
              :api-url="apiUrl"
              :select-format="selectFormat"
              :selected-format="(item) => `${item.sku} -${item.name}`"
              @data-selected="onSelected"
            />
          </div>

          <div class="mb-2">
            <label class="form-label mb-1">Trial1</label>
            <div
              v-for="value in trans.daftar_harga"
              :key="value.id"
              class="mb-2"
            >
              <!-- <input
                :ref="(el) => (value.hargaRef = el)"
                v-model="value.harga"
                type="text"
                class="form-control rounded-1 mb-2 text-end"
                name="name"
              /> -->
              <UiInputNumber2
                v-model="value.harga"
                v-model:raw="value.hargaRaw"
                :decimal="2"
              />
              {{ value.hargaRaw }}
            </div>
          </div>
        </div>
        <div class="col-xl-6 col-md-6 col-sm-12">
          <input type="file" accept="image/*" @change="onFile" />

          <UiImageCropper
            v-if="src"
            :src="src"
            :aspect-ratio="1"
            :initial-coverage="1"
            :output-width="512"
            :output-height="512"
            :background="true"
            :show-grid="true"
            :show-crosshair="true"
            theme-color="#10b981"
            @change="(box) => (lastBox = box)"
            @export="onExport"
          />

          <!-- <div v-if="preview" class="space-y-2">
            <p class="text-sm text-gray-600">Preview:</p>
            <img :src="preview" alt="preview" class="w-48 h-48" />
          </div> -->

          <div v-if="lastBox" class="text-xs text-gray-500">
            Coords: {{ JSON.stringify(lastBox) }}
          </div>
        </div>
      </div>
    </PageBody>
  </div>
</template>
