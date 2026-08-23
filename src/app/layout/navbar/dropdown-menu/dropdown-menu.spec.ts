import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { DropdownMenu } from "./dropdown-menu";
import { ENVIRONMENT } from "../../../core/tokens/environment.token";
import { environment } from "../../../../environments/environment";
import { AuthStore } from "../../../core/auth/auth.store";

describe("DropdownMenu Component", () => {
  let fixture: ComponentFixture<DropdownMenu>;
  let component: DropdownMenu;
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownMenu],
      providers: [provideRouter([]), { provide: ENVIRONMENT, useValue: environment }],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownMenu);
    component = fixture.componentInstance;
    authStore = TestBed.inject(AuthStore);
    await fixture.whenStable();
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
    const loginSpy = vi.spyOn(authStore, "login").mockImplementation(() => Promise.resolve());
    const registerSpy = vi.spyOn(authStore, "register").mockImplementation(() => Promise.resolve());
    const logoutSpy = vi.spyOn(authStore, "logout").mockImplementation(() => Promise.resolve());

    component.isOpen.set(true);
    component.onSignIn();
    expect(component.isOpen()).toBe(false);
    expect(loginSpy).toHaveBeenCalled();

    component.isOpen.set(true);
    component.onSignUp();
    expect(component.isOpen()).toBe(false);
    expect(registerSpy).toHaveBeenCalled();

    component.isOpen.set(true);
    component.onSignOut();
    expect(component.isOpen()).toBe(false);
    expect(logoutSpy).toHaveBeenCalled();
  });
});
