import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { ClientsComponent } from "./clients";

describe("ClientsComponent", () => {
  let component: ClientsComponent;
  let fixture: ComponentFixture<ClientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create clients component and render actions", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Clients");
    expect(compiled.textContent).toContain("Add Client");
    expect(compiled.textContent).toContain("Client Directory Ready");
  });
});
