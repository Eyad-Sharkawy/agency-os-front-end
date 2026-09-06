import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HowItWorks } from "./how-it-works";

describe("HowItWorks", () => {
  let component: HowItWorks;
  let fixture: ComponentFixture<HowItWorks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowItWorks],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HowItWorks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize preview timer to 03:14:22 and format correctly", () => {
    expect(component.formattedTimer()).toBe("03:14:22");
  });

  it("should increment preview timer when updated", () => {
    component.timerSeconds.update(s => s + 1);
    expect(component.formattedTimer()).toBe("03:14:23");
  });

  it("should clear timer interval on destruction", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    fixture.destroy();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
