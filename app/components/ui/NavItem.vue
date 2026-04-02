<script lang="ts" setup>
interface Props {
  to: string;
  icon: string;
  title: string;
}

const props = defineProps<Props>();
const route = useRoute();
const activex = ref(false);

const getActive = () => {
  if (props.to === "/") {
    activex.value = route.path === props.to;
  } else {
    activex.value = route.path.startsWith(props.to);
  }
};

watch(route, () => {
  getActive();
});
getActive();
</script>

<template>
  <li class="nav-item" :class="{ active: activex }">
    <NuxtLink class="nav-link" :to="to" :class="{ active: activex }">
      <span class="nav-link-icon d-md-none d-lg-inline-block">
        <Icon :name="icon" class="icon" />
      </span>
      <span class="nav-link-title"> {{ title }} </span>
    </NuxtLink>
  </li>
</template>
