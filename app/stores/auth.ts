// stores/auth.ts
import type { ApiErrorResponse } from "~/types/api";
import type { FetchError } from "ofetch";
interface User {
  name: string;
  username: string;
  email: string;
  picture: string;
  role: string; // misalnya "admin", "editor", "user"
}

const url = "http://localhost:3050/api/";
const { setFlash } = useFlash();

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: null as string | null,
    refreshToken: null as string | null,
    user: null as User | null,
    rememberMe: false as boolean,
    loading: false as boolean,
  }),
  getters: {
    isAuthenticated(): boolean {
      return !!this.accessToken && !!this.user;
    },
    getRefreshToken(): string | null {
      return this.refreshToken;
    },
    getAccessToken(): string | null {
      return this.accessToken;
    },
  },
  actions: {
    async login(email: string, password: string, rememberMe = false) {
      try {
        this.loading = true;
        const res = await $fetch<{
          access_token: string;
          refresh_token?: string;
        }>(`${url}auth/login`, {
          method: "POST",
          body: { email, password },
          credentials: "include",
        });
        this.rememberMe = rememberMe;
        this.accessToken = res.access_token;
        await this.fetchUser();
      } catch (err) {
        const e = err as FetchError<ApiErrorResponse>;
        const res = e?.data;
        if (res?.error) {
          setFlash(res.error, "error");
        } else {
          setFlash("Terjadi kesalahan", "error");
        }
      }
      this.loading = false;
    },
    async glogin(access_token: string, rememberMe = false) {
      try {
        this.loading = true;
        const res = await $fetch<{
          access_token: string;
        }>(`${url}auth/google`, {
          method: "POST",
          body: { access_token, rememberMe },
          credentials: "include",
        });
        this.accessToken = res.access_token;
        await this.fetchUser();
      } catch (err) {
        const e = err as FetchError<ApiErrorResponse>;
        const res = e?.data;
        if (res?.error) {
          setFlash(res.error, "error");
        } else {
          setFlash("Terjadi kesalahan", "error");
        }
      }
      this.loading = false;
    },
    async setAccessToken() {
      // hanya perbarui access token di server ssr
      if (import.meta.client) return false;
      const refresh = this.refreshToken;
      if (!refresh) return false;
      try {
        const res = await $fetch<{
          access_token: string;
        }>(`${url}auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            Cookie: `refreshToken=${refresh}`,
          },
          // body: { refresh_token: refresh },
        });

        // console.log(res);

        this.accessToken = res.access_token;
        this.refreshToken = null;
        return true;
      } catch {
        this.clearAuth();
        return false;
      }
    },
    async refreshAccessToken() {
      // perbarui access token
      // const refresh = this.refreshToken;
      // if (!refresh) return false;
      try {
        console.log("refresh access token");
        const res = await $fetch<{
          access_token: string;
        }>(`${url}auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        this.accessToken = res.access_token;
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    },
    async fetchUser() {
      // cek apakah access token ada
      if (!this.accessToken) {
        const refreshed = this.refreshAccessToken();
        if (!refreshed) return;
      }
      // ambil data user
      try {
        const data = await $fetch<User>(`${url}auth/me`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        });
        this.user = data;
        useCookie("UID", {
          default: () => JSON.stringify(this.user),
          path: "/",
          maxAge: 60 * 60 * 24 * 30 * 6, // 6 bulan
        });
      } catch {
        this.user = null;
      }
    },
    loadRefreshToken() {
      if (useCookie("refreshToken").value) {
        this.refreshToken = useCookie("refreshToken").value as string;
      } else {
        this.refreshToken = null;
      }
    },
    loadAccessToken() {
      if (!useCookie("ACCESS_TOKEN").value) return;
      // console.log("load access token xxx");

      this.accessToken = useCookie("ACCESS_TOKEN").value as string;
    },
    loadUser() {
      if (import.meta.client) return;
      if (useCookie("UID").value) {
        this.user = useCookie("UID").value as unknown as User;
      }
    },
    clearAuth() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
    },
    async logout() {
      if (useCookie("UID").value) {
        useCookie("UID", {
          path: "/",
          maxAge: -1,
        });
      }
      try {
        await $fetch(`${url}auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.error("Logout error:", e);
      } finally {
        // Bersihkan state frontend
        this.user = null;
        this.accessToken = null;
        await refreshCookie("UID");
        await refreshCookie("refreshToken");
      }
      // langsung otomatis ke halaman login
      // karena middleware auth.global.ts otomatis dijalankan akibat reactivity authStore
    },
    async checkAccess(path: string): Promise<boolean> {
      // Pastikan ada accessToken
      if (!this.accessToken) {
        // const refreshed = await this.setAccessToken();
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) return false;
      }

      const doCheck = async (): Promise<boolean> => {
        const res = await $fetch<{ allowed: boolean }>(
          `${url}autorization/check-access`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${this.accessToken}` },
            body: { path },
          }
        );
        return res.allowed;
      };

      try {
        return await doCheck();
      } catch {
        // Jika gagal, coba refresh token dan ulangi
        // const refreshed = await this.setAccessToken();
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) return false;

        try {
          return await doCheck();
        } catch {
          // this.clearAuth();
          this.logout();
          return false;
        }
      }
    },
  },
});
