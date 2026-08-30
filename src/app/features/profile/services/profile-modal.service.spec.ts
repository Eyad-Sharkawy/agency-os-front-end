import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProfileModalService } from "./profile-modal.service";

describe("ProfileModalService", () => {
  let service: ProfileModalService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ProfileModalService],
    });
    service = TestBed.inject(ProfileModalService);
    router = TestBed.inject(Router);
  });

  it("should be created with closed state and default personal tab", () => {
    expect(service.isOpen()).toBe(false);
    expect(service.activeTab()).toBe("personal");
  });

  it("should open modal with default or specified tab and sync query params", () => {
    const navSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    service.open("security");
    expect(service.isOpen()).toBe(true);
    expect(service.activeTab()).toBe("security");
    expect(navSpy).toHaveBeenCalledWith([], {
      queryParams: { profile: "security" },
      queryParamsHandling: "merge",
    });

    service.open();
    expect(service.isOpen()).toBe(true);
    expect(service.activeTab()).toBe("personal");
  });

  it("should close modal and clear query param", () => {
    const navSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    service.open();
    expect(service.isOpen()).toBe(true);

    service.close();
    expect(service.isOpen()).toBe(false);
    expect(navSpy).toHaveBeenCalledWith([], {
      queryParams: { profile: null },
      queryParamsHandling: "merge",
    });
  });

  it("should change active tab and sync query param", () => {
    const navSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    service.setTab("advanced");
    expect(service.activeTab()).toBe("advanced");
    expect(navSpy).toHaveBeenCalledWith([], {
      queryParams: { profile: "advanced" },
      queryParamsHandling: "merge",
    });

    service.setTab("sessions");
    expect(service.activeTab()).toBe("sessions");
  });
});
