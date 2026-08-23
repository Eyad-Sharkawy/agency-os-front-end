import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal, WritableSignal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { DropdownMenu } from "./dropdown-menu";
import { ENVIRONMENT } from "../../../core/tokens/environment.token";
import { environment } from "../../../../environments/environment";
import { AuthStore } from "../../../core/auth/auth.store";

describe("DropdownMenu Component", () => {
  let fixture: ComponentFixture<DropdownMenu>;
  let component: DropdownMenu;
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
      imports: [DropdownMenu],
      providers: [
        provideRouter([]),
        { provide: ENVIRONMENT, useValue: environment },
        { provide: AuthStore, useValue: mockAuthStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle and close menu", () => {
    expect(component.isOpen()).toBe(false);
    component.toggle();
    expect(component.isOpen()).toBe(true);
    component.close();
    expect(component.isOpen()).toBe(false);
  });

  it("should show Features and How It Works in mobile menu when not authenticated", () => {
    component.isOpen.set(true);
    isAuthSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Features");
    expect(compiled.textContent).toContain("How It Works");
  });

  it("should hide Features and How It Works in mobile menu when authenticated", () => {
    component.isOpen.set(true);
    isAuthSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain("Features");
    expect(compiled.textContent).not.toContain("How It Works");
  });

  it("should close on escape key event", () => {
    component.isOpen.set(true);
    component.onEscape();
    expect(component.isOpen()).toBe(false);
  });

  it("should close on document click outside element", () => {
    component.isOpen.set(true);
    const outsideEl = document.createElement("div");
    const mockEvent = new MouseEvent("click");
    Object.defineProperty(mockEvent, "target", { value: outsideEl });

    component.onDocumentClick(mockEvent);
    expect(component.isOpen()).toBe(false);
  });

  it("should trigger sign in, sign up, and sign out", () => {
    component.isOpen.set(true);
    component.onSignIn();
    expect(component.isOpen()).toBe(false);
    expect(mockAuthStore.login).toHaveBeenCalled();

    component.isOpen.set(true);
    component.onSignUp();
    expect(component.isOpen()).toBe(false);
    expect(mockAuthStore.register).toHaveBeenCalled();

    component.isOpen.set(true);
    component.onSignOut();
    expect(component.isOpen()).toBe(false);
    expect(mockAuthStore.logout).toHaveBeenCalled();
  });
});
