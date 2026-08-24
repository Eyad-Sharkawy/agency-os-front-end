import { InjectionToken } from "@angular/core";

export const NAVIGATOR = new InjectionToken<Navigator>("NAVIGATOR", {
  providedIn: "root",
  factory: () => (typeof navigator !== "undefined" ? navigator : ({} as Navigator)),
});
