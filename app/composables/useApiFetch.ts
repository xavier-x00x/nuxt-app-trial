// composables/useApiFetch.ts
// fungsi : untuk ambil data dari API dengan fitur auto refresh token pada 401 dan timeout request
import { useAuthStore, getAccessTokenCookie } from "~/stores/authStore";
import { useRuntimeConfig } from "#app";

/**
 * Wrapper around Nuxt's useFetch that automatically adds the Authorization header,
 * handles token refresh on 401 responses with a limited retry count,
 * and sets a request timeout.
 */
export function useApiFetch<T>(url: string, options: any = {}) {
  const auth = useAuthStore();
  const MAX_RETRY = 3; // number of retries after a 401
  let retryCount = 0;

  const config = useRuntimeConfig();
  const baseURL = config.public.apiUrl;

  return useFetch<T>(url, {
    baseURL,
    timeout: 10000, // 10 seconds timeout per request
    headers: {},
    retry: 0, // manual retry handling
    // Dynamically attach Authorization header on each request
    onRequest({ options: reqOptions }) {
      const token = auth.accessToken || getAccessTokenCookie().value;
      if (token) {
        reqOptions.headers.set('Authorization', `Bearer ${token}`);
      }
    },
    // Merge any user‑provided options (allow overrides after onRequest)
    ...options,
    // Handle 401 errors: refresh token and retry once
    async onResponseError({ response, options }) {
      if (response.status === 401 && retryCount < MAX_RETRY) {
        retryCount++;
        try {
          await auth.refreshAccessToken();
          // Retry the original request with the new token
          return await $fetch<T>(url, {
            ...options,
            headers: {
              Authorization: `Bearer ${auth.accessToken}`,
              ...(options.headers || {}),
            },
            baseURL,
            method: options.method as any,
          });
        } catch (err) {
          await auth.logout();
          throw err;
        }
      }
      // Propagate other errors or when the retry limit is exceeded
      throw response;
    },
  });
}
