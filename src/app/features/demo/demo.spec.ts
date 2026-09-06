import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthStore } from "../../core/auth/stores/auth.store";
import { DemoComponent } from "./demo";

describe("DemoComponent", () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;
  let router: Router;

  let authStoreMock: {
    loginDemo: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authStoreMock = {
      loginDemo: vi.fn().mockResolvedValue(true),
    };

    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    await TestBed.configureTestingModule({
      imports: [DemoComponent],
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreMock }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);

    fixture = TestBed.createComponent(DemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and render 8 demo personas", () => {
    expect(component).toBeTruthy();
    expect(component.personas).toHaveLength(8);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Alex Vance");
    expect(compiled.textContent).toContain("Marcus Wright");
    expect(compiled.textContent).toContain("Rachel Adams");
    expect(compiled.textContent).toContain("Sarah Chen");
    expect(compiled.textContent).toContain("Liam Rodriguez");
    expect(compiled.textContent).toContain("James Wilson");
    expect(compiled.textContent).toContain("David Miller");
    expect(compiled.textContent).toContain("Elena Rostova");
  });

  it("should launch demo session and navigate to workspaces on click", async () => {
    const persona = component.personas[0];
    await component.launchDemo(persona);

    expect(authStoreMock.loginDemo).toHaveBeenCalledWith(persona.username, "DemoPass123!");
    expect(router.navigate).toHaveBeenCalledWith(["/workspaces"]);
    expect(component.loggingInUser()).toBeNull();
  });

  it("should copy username to clipboard when copyUsername is called", () => {
    const persona = component.personas[0];
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;

    component.copyUsername(persona, fakeEvent);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(persona.username);
    expect(component.copiedField()).toBe(`${persona.username}-user`);
  });

  it("should copy password to clipboard when copyPassword is called", () => {
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;

    component.copyPassword(fakeEvent);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("DemoPass123!");
    expect(component.copiedPassword()).toBe(true);
  });

  it("should copy combined credentials text when copyCredentials is called", () => {
    const persona = component.personas[3];
    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;

    component.copyCredentials(persona, fakeEvent);

    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `Username: ${persona.username}\nPassword: DemoPass123!`,
    );
    expect(component.copiedUser()).toBe(persona.username);
  });
});
