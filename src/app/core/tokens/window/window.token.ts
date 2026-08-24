import { InjectionToken } from "@angular/core";

export const WINDOW = new InjectionToken<Window>("WINDOW", {
  providedIn: "root",
  factory: () => (typeof window !== "undefined" ? window : ({} as Window)),
});
