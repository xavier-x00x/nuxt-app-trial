<script setup lang="ts">
import {
  useTokenClient,
  type AuthCodeFlowSuccessResponse,
  type AuthCodeFlowErrorResponse,
} from "vue3-google-signin";

const props = defineProps({
  remember: {
    type: Boolean,
    default: false,
  },
});

const auth = useAuthStore();

const handleOnSuccess = async (response: AuthCodeFlowSuccessResponse) => {
  // console.log("Access Token: ", response.access_token);
  await auth.glogin(response.access_token, props.remember);
  navigateTo("/");
};

const handleOnError = (errorResponse: AuthCodeFlowErrorResponse) => {
  console.log("Error: ", errorResponse);
};
const { isReady, login } = useTokenClient({
  onSuccess: handleOnSuccess,
  onError: handleOnError,
});
</script>

<template>
  <a href="#" class="btn btn-4 w-100" :disabled="!isReady" @click="login()">
    <Icon name="i-tabler:brand-google" class="me-2 fs-2" />
    Login with Gmail
  </a>
</template>
