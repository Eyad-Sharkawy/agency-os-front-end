import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { Button } from "./button";
import { Component } from "@angular/core";

@Component({
  imports: [Button],
  template: ` <aos-button variant="primary">Click Me</aos-button> `,
})
class TestHostComponent {}

describe("Button Component", () => {
  let fixture: ComponentFixture<Button>;
  let component: Button;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button, TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function createButtonComponent(
    variant: "primary" | "secondary" | "inverted" | "outlined" | "danger" | "ghost" = "primary",
  ) {
    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("variant", variant);
    fixture.detectChanges();
    return { fixture, component };
  }

  it("should create", () => {
    const { component: btn } = createButtonComponent("primary");
    expect(btn).toBeTruthy();
  });

  it("should render a button element by default with correct type and variant classes", () => {
    const { fixture: fix } = createButtonComponent("primary");
    fix.componentRef.setInput("type", "submit");
    fix.detectChanges();

    const buttonEl = fix.nativeElement.querySelector("button");
    expect(buttonEl).toBeTruthy();
    expect(buttonEl.getAttribute("type")).toBe("submit");
    expect(buttonEl.className).toContain("bg-primary");
    expect(buttonEl.className).toContain("text-on-primary");
  });

  it("should render an external link <a> when href is provided", () => {
    const { fixture: fix } = createButtonComponent("secondary");
    fix.componentRef.setInput("href", "https://github.com");
    fix.componentRef.setInput("target", "_blank");
    fix.detectChanges();

    const linkEl = fix.nativeElement.querySelector("a");
    expect(linkEl).toBeTruthy();
    expect(linkEl.getAttribute("href")).toBe("https://github.com");
    expect(linkEl.getAttribute("target")).toBe("_blank");
    expect(linkEl.getAttribute("rel")).toBe("noopener noreferrer");
    expect(fix.nativeElement.querySelector("button")).toBeNull();
  });

  it("should render a router link <a> when routerLink is provided", () => {
    const { fixture: fix } = createButtonComponent("outlined");
    fix.componentRef.setInput("routerLink", "/how-it-works");
    fix.detectChanges();

    const linkEl = fix.nativeElement.querySelector("a");
    expect(linkEl).toBeTruthy();
    expect(fix.nativeElement.querySelector("button")).toBeNull();
    expect(linkEl.className).toContain("border");
  });

  it("should apply variant classes correctly", () => {
    const variants: ("primary" | "secondary" | "inverted" | "outlined" | "danger" | "ghost")[] = [
      "primary",
      "secondary",
      "inverted",
      "outlined",
      "danger",
      "ghost",
    ];

    for (const variant of variants) {
      const { fixture: fix } = createButtonComponent(variant);
      const buttonEl = fix.nativeElement.querySelector("button");
      expect(buttonEl).toBeTruthy();
    }
  });

  it("should handle disabled state and accessibility attributes", () => {
    const { fixture: fix } = createButtonComponent("primary");
    fix.componentRef.setInput("disabled", true);
    fix.componentRef.setInput("ariaLabel", "Submit form");
    fix.componentRef.setInput("ariaExpanded", "true");
    fix.componentRef.setInput("ariaControls", "menu-id");
    fix.detectChanges();

    const buttonEl = fix.nativeElement.querySelector("button");
    expect(buttonEl.disabled).toBe(true);
    expect(buttonEl.getAttribute("aria-label")).toBe("Submit form");
    expect(buttonEl.getAttribute("aria-expanded")).toBe("true");
    expect(buttonEl.getAttribute("aria-controls")).toBe("menu-id");
  });

  it("should project content inside button", () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
    const buttonEl = hostFixture.nativeElement.querySelector("button");
    expect(buttonEl.textContent.trim()).toBe("Click Me");
  });

  it("should apply size and shape classes correctly", () => {
    const { fixture: fix } = createButtonComponent("primary");
    fix.componentRef.setInput("size", "xs");
    fix.componentRef.setInput("shape", "circle");
    fix.detectChanges();

    const buttonEl = fix.nativeElement.querySelector("button");
    expect(buttonEl.className).toContain("text-xs");
    expect(buttonEl.className).toContain("rounded-full");
  });

  it("should handle justify, fullWidth, and buttonClass correctly", () => {
    const { fixture: fix } = createButtonComponent("primary");
    fix.componentRef.setInput("justify", "between");
    fix.componentRef.setInput("fullWidth", true);
    fix.componentRef.setInput("buttonClass", "custom-btn-class");
    fix.detectChanges();

    const buttonEl = fix.nativeElement.querySelector("button");
    expect(buttonEl.className).toContain("justify-between");
    expect(buttonEl.className).toContain("custom-btn-class");
    expect(fix.nativeElement.className).toContain("w-full");
  });
});
