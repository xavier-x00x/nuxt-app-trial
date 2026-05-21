// stores/authStore.ts
import type { ApiErrorResponse } from "~/types/api";
import type { FetchError } from "ofetch";

interface User {
  store_id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string;
  role: string;
  permissions: string[];
}

import menusData from "~/data/menus.json";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string,
    user: User
  }
}

interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
  };
}

const ACCESS_TOKEN_COOKIE = "access_token";
const USER_COOKIE = "UID";
const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes
const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 * 6; // 6 months

/**
 * Helper untuk mendapatkan API base URL dari runtime config.
 */
function getApiBase(): string {
  const config = useRuntimeConfig();
  return config.public.apiUrl || "http://localhost:3050/api";
}

/**
 * Helper untuk mengakses ACCESS_TOKEN cookie dengan options yang konsisten.
 * Ini penting karena useCookie() harus dipanggil dengan options yang sama
 * di semua tempat agar membaca/menulis cookie yang sama.
 */
export function getAccessTokenCookie(nuxtApp?: any) {
  const ctx = nuxtApp || useNuxtApp();
  return ctx.runWithContext(() => {
    return useCookie<string | null>(ACCESS_TOKEN_COOKIE, {
      path: "/",
      httpOnly: false,
      secure: import.meta.env.PROD,
      sameSite: "lax",
    });
  });
}

export function getUserCookie(nuxtApp?: any) {
  const ctx = nuxtApp || useNuxtApp();
  return ctx.runWithContext(() => {
    return useCookie<any>(USER_COOKIE, {
      path: "/",
      httpOnly: false,
    });
  });
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: null as string | null,
    user: null as User | null,
    loading: false as boolean,
    rememberMe: false as boolean,
    menus: [] as any[],
  }),

  getters: {
    isAuthenticated(): boolean {
      return !!this.accessToken && !!this.user;
    },
    userPermissions(): string[] {
      return this.user?.permissions || [];
    }
  },

  actions: {
    // ── Cookie helpers ──────────────────────────────────────────────
    // Accept `nuxtApp` parameter so callers can pass a pre-captured
    // reference that survives across `await` boundaries.

    setCookie(name: string, value: any, options: { maxAge?: number } = {}, ctx?: any) {
      const nuxtApp = ctx || useNuxtApp();
      nuxtApp.runWithContext(() => {
        // Untuk ACCESS_TOKEN dan UID, gunakan helper yang konsisten
        if (name === ACCESS_TOKEN_COOKIE) {
          const cookie = getAccessTokenCookie(nuxtApp);
          cookie.value = value;
        } else if (name === USER_COOKIE) {
          const cookie = getUserCookie(nuxtApp);
          cookie.value = value;
        } else {
          // Cookie lainnya pakai default options
          const cookie = useCookie<any>(name, {
            path: "/",
            maxAge: options.maxAge,
            secure: import.meta.env.PROD,
            sameSite: "lax",
            httpOnly: false,
          });
          cookie.value = value;
        }
        
        if (import.meta.dev) {
          console.log(`[authStore] setCookie(${name}) - value set: ${value}, maxAge:`, options.maxAge);
        }
      });
    },

    clearCookie(name: string, ctx?: any) {
      const nuxtApp = ctx || useNuxtApp();
      nuxtApp.runWithContext(() => {
        // Gunakan helper yang konsisten untuk ACCESS_TOKEN dan UID
        if (name === ACCESS_TOKEN_COOKIE) {
          const cookie = getAccessTokenCookie(nuxtApp);
          cookie.value = null;
        } else if (name === USER_COOKIE) {
          const cookie = getUserCookie(nuxtApp);
          cookie.value = null;
        } else {
          useCookie<any>(name, {
            path: "/",
            maxAge: 0,
            expires: new Date(0),
          }).value = null;
        }
      });
    },



    updateMenus(ctx?: any) {
      if (!this.user) {
        this.menus = [];
      } else {
        const role = this.user.role || "";
        const perms = this.user.permissions || [];
        
        if (role === "administrator" || role === "programmer") {
          this.menus = menusData;
        } else {
          this.menus = menusData.filter((item: any) => {
            if (!item.permission) return true;
            return perms.includes(item.permission);
          });
        }
      }
    },

    // ── Load / Persist ─────────────────────────────────────────────
    loadFromCookies() {
      const nuxtApp = useNuxtApp();
      nuxtApp.runWithContext(() => {
        const tokenCookie = getAccessTokenCookie(nuxtApp);
        const token = tokenCookie.value || null;
        
        if (import.meta.dev) {
          console.log('[authStore] loadFromCookies - token exists:', !!token, 'env:', import.meta.server ? 'server' : 'client');
        }
        
        // if (token) {
        this.accessToken = token; // Pastikan state selalu sinkron dengan cookie, bahkan jika null
        // }
        // karena saat ada 2 tab, tab pertama logout (hapus cookie) lalu buka tab kedua, state harus update ke null juga
        // jadi jangan pakai kondisi if (token) karena kalau token sudah expired dan dihapus, cookie akan null tapi state tetap tidak berubah

        // Fallback robust reader for Nuxt auto-parsing quirks
        let userData = getUserCookie(nuxtApp).value;
        if (userData) {
          if (typeof userData === 'string') {
            try { userData = JSON.parse(userData); } catch {}
          }
          if (typeof userData === 'object') {
            this.user = userData;
          } else {
            this.user = null;
          }
        } else {
          this.user = null;
        }

        this.updateMenus(nuxtApp);

        // Clean up legacy menu cookie if it exists
        const menuCookie = useCookie("menu");
        if (menuCookie.value !== null && menuCookie.value !== undefined) {
          menuCookie.value = null;
        }
      });
    },

    persistUser(ctx?: any) {
      if (this.user) {
        // Buang permissions dari user sebelum simpan ke cookie
        const { permissions, ...userWithoutPermissions } = this.user;
        this.setCookie(USER_COOKIE, userWithoutPermissions, { maxAge: USER_COOKIE_MAX_AGE }, ctx);
      }
    },

    persistAccessToken(token: string, ctx?: any) {
      console.log('[authStore] TOKEN:', token);
      this.accessToken = token;
      this.setCookie(ACCESS_TOKEN_COOKIE, token, { maxAge: ACCESS_TOKEN_MAX_AGE }, ctx);
      
      if (import.meta.dev) {
        console.log('[authStore] persistAccessToken - token saved, length:', token.length);
      }
    },

    clearAuth(ctx?: any) {
      this.user = null;
      this.accessToken = null;
      this.menus = [];
      this.clearCookie(USER_COOKIE, ctx);
      this.clearCookie(ACCESS_TOKEN_COOKIE, ctx);
      // this.clearCookie("menu", ctx);
    },

    // ── Auth actions ───────────────────────────────────────────────
    // Each async action captures `useNuxtApp()` BEFORE any `await`
    // and threads it through to cookie operations.

    async login(identity: string, password: string, remember = false) {
      const nuxtApp = useNuxtApp();
      try {
        this.loading = true;
        this.rememberMe = remember;

        const res = await $fetch<LoginResponse>(
          `${getApiBase()}/auth/login`,
          {
            method: "POST",
            body: { identity, password, remember },
            credentials: "include",
          }
        );

        this.persistAccessToken(res.data.access_token, nuxtApp);
        await this.fetchUser();
      } catch (err) {
        const e = err as FetchError<ApiErrorResponse>;
        const message = e?.data?.error || "Terjadi kesalahan";
        // useFlash().setFlash(message, "error");
      } finally {
        this.loading = false;
      }
    },

    async glogin(providerToken: string, remember = false) {
      const nuxtApp = useNuxtApp();
      try {
        this.loading = true;
        this.rememberMe = remember;

        const res = await $fetch<RefreshResponse>(
          `${getApiBase()}/auth/google/token`,
          {
            method: "POST",
            body: { token: providerToken, token_type: 'access', remember },
            credentials: "include",
          }
        );

        this.persistAccessToken(res.data.access_token, nuxtApp);
        await this.fetchUser();
      } catch (err) {
        const e = err as FetchError<RefreshResponse>;
        const message = e?.data?.message || "Terjadi kesalahan";
        useFlash().setFlash(message, "error");
      } finally {
        this.loading = false;
      }
    },

    async refreshAccessToken(ctx?: any): Promise<boolean> {
      const nuxtApp = ctx || useNuxtApp();
      try {
        const headers: Record<string, string> = {};
        const options: Record<string, any> = {
          method: "POST",
        };

        // SSR: ambil dari request headers
        if (import.meta.server) {
          const reqHeaders = useRequestHeaders(['cookie']);
          if (reqHeaders.cookie) {
            const refreshToken = reqHeaders.cookie
              .split(';')
              .map(c => c.trim())
              .find(c => c.startsWith('refresh_token='));

            if (refreshToken) {
              headers.cookie = refreshToken;
            }
          }
          options.headers = headers;
        }
        // Client: ambil dari document.cookie
        else if (typeof document !== 'undefined') {
          const cookies = document.cookie
            .split(';')
            .map(c => c.trim())
            .filter(c => c.startsWith('refresh_token='));
          if (cookies.length) {
            headers.cookie = cookies.join('; ');
          }
          console.log('headers.cookie:', document.cookie);
          options.credentials = "include";
        }

        

        const res = await $fetch<RefreshResponse>(
          `${getApiBase()}/auth/refresh`, options
        );

        if (import.meta.dev) {
          console.log('[authStore] refreshAccessToken - success, got new token');
        }
        this.persistAccessToken(res.data.access_token, nuxtApp);
        return true;
      } catch (err) {
        if (import.meta.dev) {
          console.log('[authStore] refreshAccessToken - failed:', import.meta.server ? 'server' : 'client', err);
        }
        return false;
      }
    },

    async fetchUser(forceRefresh = false) {
      const nuxtApp = useNuxtApp();

      if (import.meta.dev) {
        console.log(`[authStore] fetchUser - accessToken:`, !!this.accessToken, `forceRefresh:`, forceRefresh, `env:`, import.meta.server ? 'server' : 'client');
      }

      if (!this.accessToken) {
        if (import.meta.dev) {
          console.log('[authStore] fetchUser - no token, calling refreshAccessToken');
        }
        const refreshed = await this.refreshAccessToken(nuxtApp);
        if (!refreshed) return;
      } else if (forceRefresh) {
        const refreshed = await this.refreshAccessToken(nuxtApp);
        if (!refreshed) {
          this.clearAuth(nuxtApp);
          return;
        }
      }

      try {
        const data = await $fetch<{ data: User }>(`${getApiBase()}/auth/me`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        this.user = data.data;
        this.persistUser(nuxtApp);
        this.updateMenus(nuxtApp);
      } catch (error) {
        console.warn("[authStore] fetchUser failed, trying token refresh:", error);

        const refreshed = await this.refreshAccessToken(nuxtApp);
        if (!refreshed) {
          this.clearAuth(nuxtApp);
          return;
        }

        try {
          const data = await $fetch<{ data: User }>(`${getApiBase()}/auth/me`, {
            headers: { Authorization: `Bearer ${this.accessToken}` },
          });
          this.user = data.data;
          this.persistUser(nuxtApp);
          this.updateMenus(nuxtApp);
        } catch {
          this.clearAuth(nuxtApp);
        }
      }
    },

    async logout() {
      const nuxtApp = useNuxtApp();
      this.clearAuth(nuxtApp);

      try {
        const headers: Record<string, string> = {};

        // SSR: ambil dari request headers
        if (import.meta.server) {
          const reqHeaders = useRequestHeaders(['cookie']);
          if (reqHeaders.cookie) {
            const cookies = reqHeaders.cookie
              .split(';')
              .map(c => c.trim())
              .filter(c => c.startsWith('refresh_token=') || c.startsWith('access_token='));
            if (cookies.length) {
              headers.cookie = cookies.join('; ');
            }
          }
        } 
        // Client: ambil dari document.cookie
        else if (typeof document !== 'undefined') {
          const cookies = document.cookie
            .split(';')
            .map(c => c.trim())
            .filter(c => c.startsWith('refresh_token=') || c.startsWith('access_token='));
          if (cookies.length) {
            headers.cookie = cookies.join('; ');
          }
        }

        await $fetch(`${getApiBase()}/auth/logout`, {
          method: "POST",
          headers,
        });
      } catch (e) {
        console.error("[authStore] Logout error:", e);
      }
    },

    async checkAccess(path: string): Promise<boolean> {
      // const nuxtApp = useNuxtApp();

      if (!this.isAuthenticated) return false;

      console.log(this.user);
      
      if (this.user?.role === "administrator" || this.user?.role === "programmer"){
        return true;
      }

      return this.userPermissions.includes(path);

      // if (!this.accessToken) {
      //   const refreshed = await this.refreshAccessToken(nuxtApp);
      //   if (!refreshed) return false;
      // }

      // const doCheck = async (): Promise<boolean> => {
      //   const headers: Record<string, string> = {
      //     Authorization: `Bearer ${this.accessToken}`
      //   };
      //   if (import.meta.server) {
      //     const reqHeaders = useRequestHeaders(['cookie']);
      //     if (reqHeaders.cookie) {
      //       headers.cookie = reqHeaders.cookie;
      //     }
      //   }

      //   const res = await $fetch<{ data: boolean }>(
      //     `${getApiBase()}/roles/authorization`,
      //     {
      //       method: "POST",
      //       timeout: 5000,
      //       headers,
      //       body: { path },
      //     }
      //   );
      //   return res.data;
      // };

      // try {
      //   return await doCheck();
      // } catch (error) {
      //   console.warn("[authStore] checkAccess failed, retrying:", error);

      //   const refreshed = await this.refreshAccessToken(nuxtApp);
      //   if (!refreshed) return false;

      //   try {
      //     return await doCheck();
      //   } catch {
      //     return false;
      //   }
      // }
    },
  },
});
