/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// composables/useApiFetch.ts
import { useAuthStore } from "~/stores/auth";

export function useApiFetch<T>(url: string, options: any = {}) {
  const auth = useAuthStore();
  // const config = useRuntimeConfig()
  // console.log("useApiFetch", url, auth.accessToken);

  // tambahkan baseURL bila perlu
  // const baseURL = config.public.apiBase || "http://localhost:3050"
  const baseURL = "http://localhost:3050";

  return useFetch<T>(url, {
    baseURL,
    retry: 0, // kita handle retry manual
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      ...options.headers,
    },
    ...options,
    async onResponseError({ response, request, options }) {
      // bila 401 (token invalid/expired)
      if (response.status === 401) {
        try {
          // refresh token
          await auth.refreshAccessToken();

          // ulangi request sekali lagi
          return await $fetch<T>(url, {
            ...options,
            headers: {
              Authorization: `Bearer ${auth.accessToken}`,
              ...(options.headers || {}),
            },
            baseURL,
            method: options.method as
              | "GET"
              | "HEAD"
              | "PATCH"
              | "POST"
              | "PUT"
              | "DELETE"
              | "CONNECT"
              | "OPTIONS"
              | "TRACE"
              | "get"
              | "head"
              | "patch"
              | "post"
              | "put"
              | "delete"
              | "connect"
              | "options"
              | "trace"
              | undefined,
          });
        } catch (err) {
          // bila refresh gagal, logout
          await auth.logout();
          throw err;
        }
      }
    },
  });
}
