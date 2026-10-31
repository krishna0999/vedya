// Current-user state. Thin: the session itself lives in an httpOnly cookie the
// browser sends automatically; this store just mirrors who we are for the UI and
// the router guard. `ready` flips true once we've asked the server once.
import { defineStore } from 'pinia';
import { api, ApiError, type AuthUser } from '@/api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    ready: false, // have we resolved the initial session yet?
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    // Resolve the current session once on app start (or after a 401).
    async init() {
      try {
        this.user = await api.me();
      } catch (err) {
        // 401 means "not signed in". A network failure (API down or waking up)
        // is treated the same: rethrowing here aborted the navigation and left
        // a blank page — signed-out pages must still render.
        if (!(err instanceof ApiError)) console.warn('[auth] session check failed', err);
        this.user = null;
      } finally {
        this.ready = true;
      }
    },
    async login(email: string, password: string) {
      this.user = await api.login(email, password);
    },
    async signup(email: string, password: string) {
      this.user = await api.signup(email, password);
    },
    async resetPassword(token: string, newPassword: string) {
      this.user = await api.resetPassword(token, newPassword);
    },
    async updateProfile(name: string) {
      this.user = await api.updateProfile(name);
    },
    async logout() {
      await api.logout();
      this.user = null;
    },
  },
});
