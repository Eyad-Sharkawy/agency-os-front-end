import { TestBed } from "@angular/core/testing";
import { SESSION_STORAGE } from "./session-storage.token";

describe("SESSION_STORAGE InjectionToken", () => {
  it("should provide sessionStorage or in-memory fallback", () => {
    const storage = TestBed.inject(SESSION_STORAGE);
    expect(storage).toBeDefined();

    storage.setItem("session_test_key", "session_test_val");
    expect(storage.getItem("session_test_key")).toBe("session_test_val");
    expect(storage.length).toBeGreaterThanOrEqual(1);

    storage.removeItem("session_test_key");
    expect(storage.getItem("session_test_key")).toBeNull();
  });
});
