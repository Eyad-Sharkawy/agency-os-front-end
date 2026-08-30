import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { App } from "./app";
import { ENVIRONMENT } from "./core/tokens/enviroment/environment.token";
import { environment } from "../environments/environment";

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: "w/:workspaceId", component: App },
          { path: "app", component: App },
          { path: "workspaces", component: App },
        ]),
        { provide: ENVIRONMENT, useValue: environment },
      ],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it("should evaluate isAppRoute correctly", async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.isAppRoute()).toBe(false);

    await router.navigateByUrl("/w/acme");
    fixture.detectChanges();
    expect(app.isAppRoute()).toBe(true);

    await router.navigateByUrl("/app");
    fixture.detectChanges();
    expect(app.isAppRoute()).toBe(true);

    await router.navigateByUrl("/workspaces");
    fixture.detectChanges();
    expect(app.isAppRoute()).toBe(false);
  });
});
