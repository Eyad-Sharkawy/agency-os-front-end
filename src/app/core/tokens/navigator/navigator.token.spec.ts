import { TestBed } from "@angular/core/testing";
import { NAVIGATOR } from "./navigator.token";

describe("NAVIGATOR InjectionToken", () => {
  it("should provide global navigator object", () => {
    const nav = TestBed.inject(NAVIGATOR);
    expect(nav).toBeDefined();
    expect(nav).toBe(navigator);
  });
});
