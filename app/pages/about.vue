<script setup lang="ts">
const title = "About";
useHead({
  title: title,
});
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:layout-board" />
    <PageBody>
      <h1>Welcome to the {{ title }} page</h1>
      <p>This is an auto-imported component</p>
    </PageBody>
  </div>
</template>
