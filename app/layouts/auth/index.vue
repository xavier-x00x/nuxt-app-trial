<script setup lang="ts">
import { Vue3Lottie } from "vue3-lottie";
</script>
<template>
  <div class="d-flex flex-column justify-content-center">
    <div class="page">
      <div class="container container-normal">
        <div class="row align-items-center g-4 vh-100 py-3">
          <div class="col-lg">
            <slot />
          </div>
          <div class="col-lg d-none d-lg-block">
            <client-only>
              <Vue3Lottie
                animation-link="/vendor/lottie/AnimationLogin.json"
                :height="550"
                :width="550"
              />
            </client-only>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
