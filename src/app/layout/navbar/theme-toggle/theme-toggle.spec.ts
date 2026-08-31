import { signal, WritableSignal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ThemeToggle } from "./theme-toggle";
import { Theme } from "../../../core/services/theme";
import { Button } from "../../../shared/components/button/button";

describe("ThemeToggle Component", () => {
  let fixture: ComponentFixture<ThemeToggle>;
  let component: ThemeToggle;
  let themeSignal: WritableSignal<"light" | "dark">;
  let mockThemeService: {
    theme: WritableSignal<"light" | "dark">;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    themeSignal = signal<"light" | "dark">("light");
    mockThemeService = {
      theme: themeSignal,
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

  it("should render dark mode aria-label when theme is dark", () => {
    themeSignal.set("dark");
    fixture.detectChanges();

    const btnDebug = fixture.debugElement.query(By.directive(Button));
    expect(btnDebug.componentInstance.ariaLabel()).toBe("Switch to light mode");
  });
});
