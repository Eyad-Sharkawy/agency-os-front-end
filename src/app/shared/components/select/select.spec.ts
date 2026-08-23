import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Select, SelectOption } from "./select";

describe("Select Component", () => {
  let component: Select<string>;
  let fixture: ComponentFixture<Select<string>>;

  const mockOptions: SelectOption<string>[] = [
    { label: "Member", value: "MEMBER", description: "Standard access" },
    { label: "Admin", value: "ADMIN", description: "Workspace management" },
    { label: "Client", value: "CLIENT", disabled: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Select],
    }).compileComponents();

    fixture = TestBed.createComponent(Select<string>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("options", mockOptions);
    fixture.componentRef.setInput("value", "MEMBER");
    fixture.detectChanges();
  });

  it("should create select component and show selected option label", () => {
    expect(component).toBeTruthy();
    expect(component.selectedLabel()).toBe("Member");
    expect(component.isOpen()).toBe(false);
  });

  it("should toggle open/closed state on trigger click", () => {
    component.toggleOpen();
    expect(component.isOpen()).toBe(true);

    component.toggleOpen();
    expect(component.isOpen()).toBe(false);
  });

  it("should not open when disabled", () => {
    fixture.componentRef.setInput("disabled", true);
    fixture.detectChanges();

    component.toggleOpen();
    expect(component.isOpen()).toBe(false);
  });

  it("should emit valueChange and close menu when selecting an enabled option", () => {
    let emittedValue: string | undefined;
    component.valueChange.subscribe(v => (emittedValue = v));

    component.isOpen.set(true);
    component.selectOption(mockOptions[1]); // Admin

    expect(emittedValue).toBe("ADMIN");
    expect(component.isOpen()).toBe(false);
  });

  it("should not emit valueChange when clicking a disabled option", () => {
    let emittedValue: string | undefined;
    component.valueChange.subscribe(v => (emittedValue = v));

    component.isOpen.set(true);
    component.selectOption(mockOptions[2]); // Disabled client

    expect(emittedValue).toBeUndefined();
    expect(component.isOpen()).toBe(true);
  });

  it("should close on Escape keydown", () => {
    component.isOpen.set(true);
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    component.onKeydown(event);

    expect(component.isOpen()).toBe(false);
  });

  it("should toggle on Enter keydown", () => {
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    component.onKeydown(event);

    expect(component.isOpen()).toBe(true);
  });

  it("should close when clicking outside component", () => {
    component.isOpen.set(true);
    const outsideEvent = new MouseEvent("click");
    Object.defineProperty(outsideEvent, "target", { value: document.body });

    component.onDocumentClick(outsideEvent);
    expect(component.isOpen()).toBe(false);
  });
});
