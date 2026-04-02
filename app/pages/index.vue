<script setup lang="ts">
const title = "Home";
useHead({
  title: title,
});
</script>
<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:home" />
    <PageBody>
      <h1>Welcome to the homepage</h1>
      <p>This is an auto-imported component</p>
    </PageBody>
  </div>
</template>
