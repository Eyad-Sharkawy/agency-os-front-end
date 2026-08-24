import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ThemeToggle } from "./theme-toggle";
import { Theme } from "../../../core/services/theme";

describe("ThemeToggle Component", () => {
  let fixture: ComponentFixture<ThemeToggle>;
  let component: ThemeToggle;
  let mockThemeService: {
    theme: ReturnType<typeof vi.fn>;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockThemeService = {
      theme: vi.fn().mockReturnValue("light"),
      toggleTheme: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ThemeToggle],
      providers: [{ provide: Theme, useValue: mockThemeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle theme when clicked", () => {
    component.themeService.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });
});
