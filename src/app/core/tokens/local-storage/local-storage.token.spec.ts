import { TestBed } from "@angular/core/testing";
import { LOCAL_STORAGE } from "./local-storage.token";

describe("LOCAL_STORAGE InjectionToken", () => {
  it("should provide localStorage or in-memory fallback", () => {
    const storage = TestBed.inject(LOCAL_STORAGE);
    expect(storage).toBeDefined();

    storage.setItem("test_key", "test_value");
    expect(storage.getItem("test_key")).toBe("test_value");
    expect(storage.length).toBeGreaterThanOrEqual(1);

    storage.removeItem("test_key");
    expect(storage.getItem("test_key")).toBeNull();
  });
});
