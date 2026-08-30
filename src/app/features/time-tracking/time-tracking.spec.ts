import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { TimeTrackingComponent } from "./time-tracking";

describe("TimeTrackingComponent", () => {
  let component: TimeTrackingComponent;
  let fixture: ComponentFixture<TimeTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeTrackingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create time tracking component and render header", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Time Tracking");
    expect(compiled.textContent).toContain("Record billable hours");
    expect(compiled.textContent).toContain("Manual Entry");
    expect(compiled.textContent).toContain("Start Timer");
  });
});
