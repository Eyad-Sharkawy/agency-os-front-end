import { TestBed } from "@angular/core/testing";
import { WINDOW } from "./window.token";

describe("WINDOW InjectionToken", () => {
  it("should provide global window object", () => {
    const win = TestBed.inject(WINDOW);
    expect(win).toBeDefined();
    expect(win).toBe(window);
  });
});
