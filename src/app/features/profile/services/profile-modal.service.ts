import { inject, Injectable, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";

export type PROFILE_TAB = "personal" | "security" | "sessions" | "advanced";

const VALID_TABS: readonly PROFILE_TAB[] = [
  "personal",
  "security",
  "sessions",
  "advanced",
] as const;

@Injectable({
  providedIn: "root",
})
export class ProfileModalService {
  private readonly router = inject(Router, { optional: true });

  readonly isOpen = signal<boolean>(false);
  readonly activeTab = signal<PROFILE_TAB>("personal");

  constructor() {
    this.checkQueryParamsFromUrl();

    if (this.router) {
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.checkQueryParamsFromUrl();
        });
    }
  }

  private checkQueryParamsFromUrl(): void {
    if (typeof window === "undefined" || !window.location?.search) return;

    const urlParams = new URLSearchParams(window.location.search);
    const profileParam = urlParams.get("profile");

    if (profileParam) {
      let tab: PROFILE_TAB = "personal";
      if (profileParam === "linked-accounts" || profileParam === "advanced") {
        tab = "advanced";
      } else if (VALID_TABS.includes(profileParam as PROFILE_TAB)) {
        tab = profileParam as PROFILE_TAB;
      }
      this.activeTab.set(tab);
      this.isOpen.set(true);
    }
  }

  open(tab: PROFILE_TAB = "personal"): void {
    this.activeTab.set(tab);
    this.isOpen.set(true);
    this.syncQueryParam(tab);
  }

  close(): void {
    this.isOpen.set(false);
    this.syncQueryParam(null);
  }

  setTab(tab: PROFILE_TAB): void {
    this.activeTab.set(tab);
    this.syncQueryParam(tab);
  }

  private syncQueryParam(tab: PROFILE_TAB | null): void {
    if (!this.router) return;

    void this.router.navigate([], {
      queryParams: { profile: tab },
      queryParamsHandling: "merge",
    });
  }
}
