import {
  useTokenClient,
  type AuthCodeFlowSuccessResponse,
  type AuthCodeFlowErrorResponse,
} from "vue3-google-signin";

export const useGoogleSign = () => {
  const auth = useAuthStore();
  // const token = ref<string | null>(null);
  const handleOnSuccess = async (response: AuthCodeFlowSuccessResponse) => {
    // console.log(auth.rememberMe);
    // token.value = response.access_token;
    await auth.glogin(response.access_token);
    if (auth.isAuthenticated) {
      navigateTo("/");
    }
  };

  const handleOnError = (errorResponse: AuthCodeFlowErrorResponse) => {
    console.log("Error: ", errorResponse);
  };

  const { isReady, login } = useTokenClient({
    onSuccess: handleOnSuccess,
    onError: handleOnError,
  });

  return { isReady, login };
};
