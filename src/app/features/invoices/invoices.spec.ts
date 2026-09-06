import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { WorkspaceStore } from "../../core/multitenancy/workspace.store";
import { InvoicesComponent } from "./invoices";

describe("InvoicesComponent", () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;
  let workspaceSignal: ReturnType<typeof signal<{ role: string } | null>>;

  beforeEach(async () => {
    workspaceSignal = signal<{ role: string } | null>({ role: "ADMIN" });

    await TestBed.configureTestingModule({
      imports: [InvoicesComponent],
      providers: [
        {
          provide: WorkspaceStore,
          useValue: { activeWorkspace: workspaceSignal },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render Create Invoice button for ADMIN role", () => {
    expect(component).toBeTruthy();
    expect(component.canCreateInvoice()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Invoices");
    expect(compiled.textContent).toContain("Create Invoice");
    expect(compiled.textContent).toContain("Invoicing System Ready");
  });

  it("should hide Create Invoice button for MEMBER and CLIENT roles", () => {
    workspaceSignal.set({ role: "MEMBER" });
    fixture.detectChanges();
    expect(component.canCreateInvoice()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain("Create Invoice");

    workspaceSignal.set({ role: "CLIENT" });
    fixture.detectChanges();
    expect(component.canCreateInvoice()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain("Create Invoice");
  });
});
