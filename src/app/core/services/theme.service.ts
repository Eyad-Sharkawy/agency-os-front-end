import { Injectable, signal, effect, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

export type Theme = "light" | "dark";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly storageKey = "agency_os_theme";

  readonly theme = signal<Theme>(this.getInitialTheme());

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

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private getInitialTheme(): Theme {
    if (!this.isBrowser) {
      return "light";
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === "light" || saved === "dark") {
        return saved;
      }

      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
      // Ignore localStorage errors
    }
  }
}
