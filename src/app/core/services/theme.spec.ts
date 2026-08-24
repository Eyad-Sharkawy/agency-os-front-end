import { TestBed } from "@angular/core/testing";
import { Theme } from "./theme";
import { LOCAL_STORAGE } from "../tokens/local-storage/local-storage.token";
import { PLATFORM_ID } from "@angular/core";

describe("Theme Service", () => {
  let mockStorage: Record<string, string>;
  let fakeStorage: Storage;

  beforeEach(() => {
    mockStorage = {};
    fakeStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
      key: (i: number) => Object.keys(mockStorage)[i] || null,
      get length() {
        return Object.keys(mockStorage).length;
      },
    };

    // Default window.matchMedia mock
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("should initialize with theme from localStorage if present", () => {
    mockStorage["agency_os_theme"] = "dark";

    TestBed.configureTestingModule({
      providers: [Theme, { provide: LOCAL_STORAGE, useValue: fakeStorage }],
    });

    const themeService = TestBed.inject(Theme);
    expect(themeService.theme()).toBe("dark");
  });

  it("should fallback to matchMedia system preference when localStorage is empty", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("dark"),
        media: query,
      })),
    });

    TestBed.configureTestingModule({
      providers: [Theme, { provide: LOCAL_STORAGE, useValue: fakeStorage }],
    });

    const themeService = TestBed.inject(Theme);
    expect(themeService.theme()).toBe("dark");
  });

  it("should toggle theme between light and dark", () => {
    mockStorage["agency_os_theme"] = "light";

    TestBed.configureTestingModule({
      providers: [Theme, { provide: LOCAL_STORAGE, useValue: fakeStorage }],
    });

    const themeService = TestBed.inject(Theme);
    expect(themeService.theme()).toBe("light");

    themeService.toggleTheme();
    expect(themeService.theme()).toBe("dark");

    themeService.toggleTheme();
    expect(themeService.theme()).toBe("light");
  });

  it("should set specific theme and update state", () => {
    TestBed.configureTestingModule({
      providers: [Theme, { provide: LOCAL_STORAGE, useValue: fakeStorage }],
    });

    const themeService = TestBed.inject(Theme);
    themeService.setTheme("dark");
    expect(themeService.theme()).toBe("dark");

    themeService.setTheme("light");
    expect(themeService.theme()).toBe("light");
  });

  it("should default to light on non-browser platform", () => {
    TestBed.configureTestingModule({
      providers: [
        Theme,
        { provide: PLATFORM_ID, useValue: "server" },
        { provide: LOCAL_STORAGE, useValue: fakeStorage },
      ],
    });

    const themeService = TestBed.inject(Theme);
    expect(themeService.theme()).toBe("light");
  });
});
