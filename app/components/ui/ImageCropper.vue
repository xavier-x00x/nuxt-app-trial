<template>
  <div class="flex flex-col gap-3">
    <div ref="wrapper" class="w-full">
      <cropper-canvas
        ref="canvas"
        :background="background"
        :theme-color="themeColor"
        class="block w-full h-full"
      >
        <cropper-image
          ref="image"
          :src="src"
          alt="Image to crop"
          style="width: 100%"
          scalable
          skewable
          translatable
          @transform="onCropperImageTransform"
        />
        <cropper-shade hidden></cropper-shade>
        <cropper-handle action="select" plain></cropper-handle>
        <cropper-selection
          :id="idx"
          ref="selection"
          :aspect-ratio="aspectRatio ?? undefined"
          :initial-aspect-ratio="1"
          :initial-coverage="initialCoverage"
          movable
          resizable
          @change="onSelectionChange"
        >
          <cropper-grid v-if="showGrid" covered theme-color="#39f" />
          <cropper-crosshair v-if="showCrosshair" centered />

          <!-- Handles untuk resize/move -->
          <cropper-handle action="move" plain />
          <!-- <cropper-handle action="select" plain /> -->
          <cropper-handle action="n-resize" />
          <cropper-handle action="e-resize" />
          <cropper-handle action="s-resize" />
          <cropper-handle action="w-resize" />
          <cropper-handle action="ne-resize" />
          <cropper-handle action="nw-resize" />
          <cropper-handle action="se-resize" />
          <cropper-handle action="sw-resize" />
        </cropper-selection>
      </cropper-canvas>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="px-3 py-2 rounded bg-blue-600 text-white"
        @click="exportCropped"
      >
        Export
      </button>
    </div>

    <div class="cropper-viewers">
      <cropper-viewer
        ref="viewer"
        :selection="`#${idx}`"
        class="border border-gray-200"
        style="width: 320px; height: 240px; background-color: #00ff88"
      ></cropper-viewer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type CropperCanvas from "@cropper/element-canvas";
import type CropperImage from "@cropper/element-image";
import type CropperSelection from "@cropper/element-selection";
import type CropperViewer from "@cropper/element-viewer";
import type { Selection } from "@cropper/element-selection";

const props = defineProps<{
  src: string;
  aspectRatio?: number;
  initialAspectRatio?: number;
  initialCoverage?: number;
  background?: boolean;
  showGrid?: boolean;
  showCrosshair?: boolean;
  outputWidth?: number;
  outputHeight?: number;
  themeColor?: string;
  circle?: boolean; // ekspor crop berbentuk lingkaran (mask)
}>();

const emit = defineEmits<{
  (
    e: "change",
    box: { x: number; y: number; width: number; height: number }
  ): void;
  (
    e: "export",
    // payload: { blob: Blob; dataUrl: string; fileName: string }
    payload: { blob: Blob; fileName: string }
  ): void;
}>();

const canvas = ref<InstanceType<typeof CropperCanvas> | null>(null);
const image = ref<InstanceType<typeof CropperImage> | null>(null);
const selection = ref<InstanceType<typeof CropperSelection> | null>(null);
const viewer = ref<(HTMLElement & { selection?: HTMLElement }) | null>(null);

const wrapper = ref<HTMLElement | null>(null);
const lebar = ref(0);
const tinggi = ref(0);
const imageTrans = ref(true);
const idx = ref(`selection_${Math.random().toString(36).substring(2, 9)}`);

onMounted(() => {
  // Hubungkan viewer ke selection tanpa ID
  // if (viewer.value && selection.value) {
  //   console.log(viewer.value);
  //   viewer.value.selection = selection.value;
  // }
  // Center-kan gambar saat pertama kali siap
  image.value?.$ready(() => {
    const imgEl = image.value?.shadowRoot?.querySelector(
      "img"
    ) as HTMLImageElement;
    if (imgEl) {
      console.log("Ukuran asli:", imgEl.naturalWidth, imgEl.naturalHeight);
      const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
      lebar.value = wrapper.value?.offsetWidth ?? 0;
      tinggi.value = lebar.value / ratio;
      if (ratio < 1) {
        tinggi.value = wrapper.value?.offsetHeight ?? 0;
        lebar.value = tinggi.value * ratio;
      }
      wrapper.value?.setAttribute("style", `height: ${tinggi.value}px`);
      image.value?.$center("contain");

      const x = (lebar.value > tinggi.value ? tinggi.value : lebar.value) - 1;

      selection.value?.$center();
      selection.value?.$change(0, 0, x, x);
      // image.value?.$scale(imgEl.naturalWidth / lebar.value);
      imageTrans.value = false;
    }
  });
});

function onCropperImageTransform(e: CustomEvent) {
  if (!imageTrans.value) {
    e.preventDefault();
  }
}

// function inSelection(selection: Selection, maxSelection: Selection) {
//   return (
//     selection.x >= maxSelection.x &&
//     selection.y >= maxSelection.y &&
//     selection.x + selection.width <= maxSelection.x + maxSelection.width &&
//     selection.y + selection.height <= maxSelection.y + maxSelection.height
//   );
// }

function onSelectionChange(e: CustomEvent) {
  // const cropperCanvasRect = canvas.value?.getBoundingClientRect();
  // const selection = e.detail as Selection;

  // if (cropperCanvasRect === undefined) {
  //   return;
  // }

  // const maxSelection: Selection = {
  //   x: 0,
  //   y: 0,
  //   width: cropperCanvasRect.width,
  //   height: cropperCanvasRect.height,
  // };

  // if (!inSelection(selection, maxSelection)) {
  //   e.preventDefault();
  // }

  emit("change", e.detail as Selection);
  exportCropped();
}

async function exportCropped() {
  if (!selection.value) return;

  const canvasEl = await selection.value.$toCanvas({
    width: props.outputWidth,
    height: props.outputHeight,
  });

  // Convert to Blob + DataURL
  canvasEl.toBlob(
    async (blob) => {
      if (!blob) return;
      // const dataUrl = canvasEl.toDataURL("image/png");
      // emit("export", { blob, dataUrl, fileName: "crop.png" });
      emit("export", { blob, fileName: "crop.png" });
    },
    "image/png",
    0.92
  );
}
</script>

<style scoped>
.cropper-viewers {
  margin-top: 0.5rem;
}

.cropper-viewers > cropper-viewer {
  border: 1px solid var(--vp-c-divider);
  display: inline-block;
  margin-right: 0.25rem;
}
</style>
