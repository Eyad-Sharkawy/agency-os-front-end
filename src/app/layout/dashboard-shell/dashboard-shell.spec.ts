import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { DashboardShell } from "./dashboard-shell";

describe("DashboardShell Component", () => {
  let fixture: ComponentFixture<DashboardShell>;
  let component: DashboardShell;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardShell],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render sidebar and router outlet", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("aos-sidebar")).toBeTruthy();
    expect(compiled.querySelector("router-outlet")).toBeTruthy();
  });
});
