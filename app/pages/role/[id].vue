<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
const route = useRoute();
const title = "Edit Role";
useHead({
  title: title,
});

const dataForm = reactive({
  name: "",
  permission: [],
});

const data = reactive({
  title: title,
  isEdit: true,
  modelValue: dataForm,
});

onMounted(async () => {
  const res: { data: any } = await useApi(
    "http://localhost:3050/api/autorization/roles/" + route.params.id
  );
  dataForm.name = res?.data.name;
  dataForm.permission = res?.data.permission ?? [];
});
</script>
<template>
  <content-role-form v-bind="{ ...data, id: Number(route.params.id) }" />
</template>
