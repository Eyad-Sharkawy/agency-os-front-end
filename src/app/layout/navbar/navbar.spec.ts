import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Navbar } from "./navbar";
import { ENVIRONMENT } from "../../core/tokens/environment.token";
import { environment } from "../../../environments/environment";
import { AuthStore } from "../../core/auth/auth.store";

describe("Navbar", () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([]), { provide: ENVIRONMENT, useValue: environment }],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    authStore = TestBed.inject(AuthStore);
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle menu open state", () => {
    expect(component.isMenuOpen()).toBe(false);
    component.toggleMenu();
    expect(component.isMenuOpen()).toBe(true);
    component.toggleMenu();
    expect(component.isMenuOpen()).toBe(false);
  });

  it("should delegate sign in/up/out to AuthStore", () => {
    const loginSpy = vi.spyOn(authStore, "login").mockImplementation(() => Promise.resolve());
    const registerSpy = vi.spyOn(authStore, "register").mockImplementation(() => Promise.resolve());
    const logoutSpy = vi.spyOn(authStore, "logout").mockImplementation(() => Promise.resolve());

    component.onSignIn();
    expect(loginSpy).toHaveBeenCalled();

    component.onSignUp();
    expect(registerSpy).toHaveBeenCalled();

    component.onSignOut();
    expect(logoutSpy).toHaveBeenCalled();
  });
});
