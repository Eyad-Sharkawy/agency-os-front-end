import { signal, effect, inject, PLATFORM_ID, Service } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { LOCAL_STORAGE } from "../tokens/storage.token";

export type ThemeType = "light" | "dark";

@Service()
export class Theme {
  private readonly storage = inject(LOCAL_STORAGE);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly storageKey = "agency_os_theme";

  readonly theme = signal<ThemeType>(this.getInitialTheme());

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        const currentTheme = this.theme();
        this.applyTheme(currentTheme);
      });
    }
  }

  toggleTheme(): void {
    this.theme.update(current => (current === "dark" ? "light" : "dark"));
  }

  setTheme(theme: ThemeType): void {
    this.theme.set(theme);
  }

  private getInitialTheme(): ThemeType {
    if (!this.isBrowser) {
      return "light";
    }

    try {
      const saved = this.storage.getItem(this.storageKey);
      if (saved === "light" || saved === "dark") {
        return saved;
      }

      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  }

  private applyTheme(theme: ThemeType): void {
    if (!this.isBrowser) return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      this.storage.setItem(this.storageKey, theme);
    } catch {
      // Ignore localStorage errors
    }
  }
}
