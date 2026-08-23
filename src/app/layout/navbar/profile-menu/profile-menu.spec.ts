import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProfileMenu } from "./profile-menu";

describe("ProfileMenu", () => {
  let component: ProfileMenu;
  let fixture: ComponentFixture<ProfileMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileMenu);
    component = fixture.componentInstance;
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
});
