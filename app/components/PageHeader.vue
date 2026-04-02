<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "mdi-light:view-dashboard",
  },
});
</script>
<template>
  <div class="page-header d-print-none mt-3">
    <div class="container-fluid">
      <div class="row g-2 align-items-center">
        <div class="col">
          <div class="page-pretitle">Overview</div>
          <h2 class="page-title">
            <Icon :name="props.icon" class="me-2" />
            {{ props.title }}
          </h2>
        </div>
        <div class="col-auto ms-auto">
          <div class="btn-list">
            <!-- <span class="d-none d-sm-inline">
              <a href="#" class="btn"> New view </a>
            </span> -->
            <slot />
            <!-- <a
              href="#"
              class="btn btn-primary d-none d-sm-inline-block"
              data-bs-toggle="modal"
              data-bs-target="#modal-report"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create new report
            </a> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
