import { InjectionToken } from "@angular/core";

export const SESSION_STORAGE = new InjectionToken<Storage>("SESSION_STORAGE", {
  providedIn: "root",
  factory: () => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage;
    }

    // In-memory fallback for testing or SSR environments
    const store: Record<string, string> = {};
    return {
      get length() {
        return Object.keys(store).length;
      },
      clear: () => {
        for (const key in store) {
          delete store[key];
        }
      },
      getItem: (key: string) => store[key] || null,
      key: (index: number) => Object.keys(store)[index] || null,
      removeItem: (key: string) => {
        delete store[key];
      },
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    } as Storage;
  },
});
