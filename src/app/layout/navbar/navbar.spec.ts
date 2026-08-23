import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal, WritableSignal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { Navbar } from "./navbar";
import { ENVIRONMENT } from "../../core/tokens/environment.token";
import { environment } from "../../../environments/environment";
import { AuthStore } from "../../core/auth/auth.store";

describe("Navbar", () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let isAuthSignal: WritableSignal<boolean>;
  let mockAuthStore: {
    isAuthenticated: WritableSignal<boolean>;
    firstName: WritableSignal<string>;
    lastName: WritableSignal<string>;
    userEmail: WritableSignal<string>;
    initials: WritableSignal<string>;
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    isAuthSignal = signal(false);
    mockAuthStore = {
      isAuthenticated: isAuthSignal,
      firstName: signal("John"),
      lastName: signal("Doe"),
      userEmail: signal("john@example.com"),
      initials: signal("JD"),
      login: vi.fn().mockImplementation(() => Promise.resolve()),
      register: vi.fn().mockImplementation(() => Promise.resolve()),
      logout: vi.fn().mockImplementation(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: ENVIRONMENT, useValue: environment },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

  it("should show Features and How It Works when not authenticated", () => {
    isAuthSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Features");
    expect(compiled.textContent).toContain("How It Works");
  });

  it("should hide Features and How It Works when authenticated", () => {
    isAuthSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain("Features");
    expect(compiled.textContent).not.toContain("How It Works");
  });

  it("should delegate sign in/up/out to AuthStore", () => {
    component.onSignIn();
    expect(mockAuthStore.login).toHaveBeenCalled();

    component.onSignUp();
    expect(mockAuthStore.register).toHaveBeenCalled();

    component.onSignOut();
    expect(mockAuthStore.logout).toHaveBeenCalled();
  });
});
