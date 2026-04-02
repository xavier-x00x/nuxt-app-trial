<script setup>
import { onMounted } from "vue";
const { applyTheme } = useTheme();

onMounted(async () => {
  applyTheme();
});
</script>

<template>
  <div class="page">
    <!-- sidebar -->
    <NuxtLayout name="default-sidebar" />
    <!-- content -->
    <div class="page-wrapper">
      <!-- navbar -->
      <NuxtLayout name="default-navbar" />
      <div class="page-content">
        <slot />
      </div>
      <footer class="footer footer-transparent d-print-none py-3">
        <div class="container-fluid">
          <div class="row text-center align-items-center flex-row-reverse">
            <div class="col-lg-auto ms-lg-auto">
              <ul class="list-inline list-inline-dots mb-0">
                <li class="list-inline-item">
                  <a href="#" class="link-secondary" rel="noopener">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div class="col-12 col-lg-auto mt-3 mt-lg-0">
              <ul class="list-inline list-inline-dots mb-0">
                <li class="list-inline-item">
                  Copyright © 2025
                  <a href="." class="link-secondary">Tabler</a>. All rights
                  reserved.
                </li>
                <li class="list-inline-item">
                  <a
                    href="./changelog.html"
                    class="link-secondary"
                    rel="noopener"
                  >
                    v1.0.0
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 992px) {
  .page {
    height: 100vh;
    display: flex;
  }

  .page-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .page-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    /* background-color: green; */
  }
}
</style>
