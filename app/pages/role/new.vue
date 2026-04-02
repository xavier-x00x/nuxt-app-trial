<script setup lang="ts">
const title = "Create New Role";
useHead({
  title: title,
});

const data = reactive({
  title: title,
});
</script>
<template>
  <content-role-form v-bind="{ ...data }" />
</template>
