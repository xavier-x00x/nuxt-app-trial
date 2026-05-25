<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

interface ChildItem {
  title: string;
  to: string;
  icon?: string;
  permission?: string;
  childs?: ChildItem[];
}

interface Props {
  to?: string;
  icon?: string;
  title: string;
  childs?: ChildItem[];
}

const props = defineProps<Props>();
const route = useRoute();
const activex = ref(false);
const isOpen = ref(false);

const getActive = () => {
  if (props.childs && props.childs.length > 0) {
    activex.value = props.childs.some(c => route.path === c.to || route.path.startsWith(c.to + '/'));
    if (activex.value) {
      isOpen.value = true;
    }
  } else if (props.to) {
    if (props.to === "/") {
      activex.value = route.path === props.to;
    } else {
      activex.value = route.path === props.to || route.path.startsWith(props.to + '/');
    }
  } else {
    activex.value = false;
  }
};

watch(route, () => {
  getActive();
});

onMounted(() => {
  getActive();
});
</script>

<template>
  <li class="nav-item" :class="{ dropdown: childs && childs.length, active: activex }">
    <!-- With Children (Dropdown) -->
    <template v-if="childs && childs.length">
      <a
        class="nav-link dropdown-toggle"
        :class="{ show: isOpen }"
        href="#"
        @click.prevent="isOpen = !isOpen"
        role="button"
        :aria-expanded="isOpen ? 'true' : 'false'"
      >
        <span v-if="icon" class="nav-link-icon d-md-none d-lg-inline-block">
          <Icon :name="icon" class="icon" />
        </span>
        <span class="nav-link-title"> {{ title }} </span>
      </a>
      <div class="dropdown-menu" :class="{ show: isOpen }">
        <template v-for="child in childs" :key="child.title">
          <NuxtLink class="dropdown-item" :to="child.to" active-class="active">
            <span v-if="child.icon" class="nav-link-icon d-md-none d-lg-inline-block me-2">
              <Icon :name="child.icon" class="icon" />
            </span>
            {{ child.title }}
          </NuxtLink>
        </template>
      </div>
    </template>
    
    <!-- Without Children (Normal Link) -->
    <template v-else>
      <NuxtLink class="nav-link" :to="to!" :class="{ active: activex }">
        <span v-if="icon" class="nav-link-icon d-md-none d-lg-inline-block">
          <Icon :name="icon" class="icon" />
        </span>
        <span class="nav-link-title"> {{ title }} </span>
      </NuxtLink>
    </template>
  </li>
</template>
