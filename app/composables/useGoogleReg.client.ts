import type { ApiErrorResponse, ApiSuccessResponse } from "~/types/api";
import type { FetchError } from "ofetch";
import {
  useTokenClient,
  type AuthCodeFlowSuccessResponse,
  type AuthCodeFlowErrorResponse,
} from "vue3-google-signin";

export const useGoogleReg = () => {
  const { setFlash } = useFlash();
  const config = useRuntimeConfig();
  const handleOnSuccess = async (response: AuthCodeFlowSuccessResponse) => {
    try {
      const res = await $fetch<ApiSuccessResponse<string>>(
        "/auth/google/register",
        {
          method: "POST",
          baseURL: config.public.apiUrl || "http://localhost:3050/api",
          body: { 
            token: response.access_token,
            token_type: 'access'
          },
        }
      );
      setFlash(res.message, "success");
      navigateTo("/sign-in");
    } catch (err) {
      const e = err as FetchError<ApiErrorResponse>;
      const res = e?.data;
      if (res?.error) {
        setFlash(res.error, "error");
      } else {
        setFlash("Terjadi kesalahan", "error");
      }
    }
  };

  const handleOnError = (errorResponse: AuthCodeFlowErrorResponse) => {
    console.log("Error: ", errorResponse);
  };

  const { isReady, login } = useTokenClient({
    onSuccess: handleOnSuccess,
    onError: handleOnError,
    // other options
  });

  return { isReady, login };
};
