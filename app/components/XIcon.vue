<template>
  <iconComponent />
</template>

<script setup lang="ts">
  const props = defineProps({
    icon: {
      type: String,
      required: true,
    },
  });

  const name =
    "Icon" + props.icon.charAt(0).toUpperCase() + props.icon.slice(1);

  const iconComponent = resolveComponent(name);
</script>
