import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProfileMenu } from "./profile-menu";
import { ENVIRONMENT } from "../../../core/tokens/enviroment/environment.token";
import { environment } from "../../../../environments/environment";
import { AuthStore } from "../../../core/auth/stores/auth.store";
import { ProfileModalService } from "../../../features/profile/services/profile-modal.service";

describe("ProfileMenu", () => {
  let component: ProfileMenu;
  let fixture: ComponentFixture<ProfileMenu>;
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileMenu],
      providers: [{ provide: ENVIRONMENT, useValue: environment }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileMenu);
    component = fixture.componentInstance;
    authStore = TestBed.inject(AuthStore);
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle menu state", () => {
    expect(component.isOpen()).toBe(false);
    const mockEvent = new MouseEvent("click");
    component.toggleMenu(mockEvent);
    expect(component.isOpen()).toBe(true);
    component.close();
    expect(component.isOpen()).toBe(false);
  });

  it("should close on escape key", () => {
    component.isOpen.set(true);
    component.onEscape();
    expect(component.isOpen()).toBe(false);
  });

  it("should close on outside document click", () => {
    component.isOpen.set(true);
    const outsideElement = document.createElement("div");
    const mockEvent = new MouseEvent("click");
    Object.defineProperty(mockEvent, "target", { value: outsideElement });
    component.onDocumentClick(mockEvent);
    expect(component.isOpen()).toBe(false);
  });

  it("should trigger account management on manage account click", () => {
    const profileModalService = TestBed.inject(ProfileModalService);
    const openSpy = vi.spyOn(profileModalService, "open");
    component.isOpen.set(true);
    component.onManageAccount();
    expect(component.isOpen()).toBe(false);
    expect(openSpy).toHaveBeenCalledWith("personal");
  });

  it("should logout on sign out", () => {
    const logoutSpy = vi.spyOn(authStore, "logout").mockImplementation(() => Promise.resolve());
    component.isOpen.set(true);
    component.onSignOut();
    expect(component.isOpen()).toBe(false);
    expect(logoutSpy).toHaveBeenCalled();
  });
});
