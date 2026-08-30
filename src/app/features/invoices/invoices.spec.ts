import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { InvoicesComponent } from "./invoices";

describe("InvoicesComponent", () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create invoices component and render actions", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Invoices");
    expect(compiled.textContent).toContain("Create Invoice");
    expect(compiled.textContent).toContain("Invoicing System Ready");
  });
});
