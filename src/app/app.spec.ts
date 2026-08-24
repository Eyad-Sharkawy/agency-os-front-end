import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { App } from "./app";
import { ENVIRONMENT } from "./core/tokens/enviroment/environment.token";
import { environment } from "../environments/environment";

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: ENVIRONMENT, useValue: environment }],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it("should render navbar, main content outlet, and footer", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("aos-navbar")).toBeTruthy();
    expect(compiled.querySelector("router-outlet")).toBeTruthy();
    expect(compiled.querySelector("aos-footer")).toBeTruthy();
  });
});
