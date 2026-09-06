import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;
  let mockAuthStore: {
    loginDemo: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockAuthStore = {
      loginDemo: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter([]), { provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize preview timer to 03:42:19 and format correctly", () => {
    expect(component.formattedTimer()).toBe("03:42:19");
  });

  it("should increment preview timer when updated", () => {
    component.timerSeconds.update(s => s + 1);
    expect(component.formattedTimer()).toBe("03:42:20");
  });

  it("should clear timer interval on destruction", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    fixture.destroy();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("should handle launchDemo correctly", async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);

    await component.launchDemo("alex_owner");

    expect(mockAuthStore.loginDemo).toHaveBeenCalledWith("alex_owner", "DemoPass123!");
    expect(navigateSpy).toHaveBeenCalledWith(["/workspaces"]);
    expect(component.loggingInUser()).toBeNull();
  });
});
