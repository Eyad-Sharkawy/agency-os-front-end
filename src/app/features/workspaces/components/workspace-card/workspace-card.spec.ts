import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WorkspaceCard } from "./workspace-card";
import { WorkspaceResponse } from "../../../../core/api/models/workspace.models";

describe("WorkspaceCard Component", () => {
  let component: WorkspaceCard;
  let fixture: ComponentFixture<WorkspaceCard>;

  const mockWorkspace: WorkspaceResponse = {
    id: "w-1",
    name: "Digital Apex",
    tenantId: "tenant_digital_apex",
    contactEmail: "admin@apex.com",
    role: "OWNER",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workspace", mockWorkspace);
    fixture.componentRef.setInput("isActive", false);
    fixture.detectChanges();
  });

  it("should create component and compute initials and badges", () => {
    expect(component).toBeTruthy();
    expect(component.initials()).toBe("DA");
    expect(component.canManage()).toBe(true);
    expect(component.roleBadgeClass()).toContain("brand-green");
  });

  it("should emit selected event when clicked", () => {
    let selectedWs: WorkspaceResponse | undefined;
    component.selected.subscribe(ws => (selectedWs = ws));

    const cardElement = fixture.nativeElement.querySelector(".group") as HTMLElement;
    cardElement.click();

    expect(selectedWs).toEqual(mockWorkspace);
  });

  it("should emit manage event when manage button is clicked without selecting", () => {
    let managedWs: WorkspaceResponse | undefined;
    let selectedWs: WorkspaceResponse | undefined;
    component.manage.subscribe(ws => (managedWs = ws));
    component.selected.subscribe(ws => (selectedWs = ws));

    const manageBtn = fixture.nativeElement.querySelector("aos-button") as HTMLElement;
    manageBtn.click();

    expect(managedWs).toEqual(mockWorkspace);
    expect(selectedWs).toBeUndefined();
  });

  it("should compute initials for single word and empty names", () => {
    fixture.componentRef.setInput("workspace", { ...mockWorkspace, name: "Agency" });
    expect(component.initials()).toBe("AG");

    fixture.componentRef.setInput("workspace", { ...mockWorkspace, name: "" });
    expect(component.initials()).toBe("OS");
  });

  it("should return correct role badges for all roles", () => {
    fixture.componentRef.setInput("workspace", { ...mockWorkspace, role: "ADMIN" });
    expect(component.roleBadgeClass()).toContain("primary");

    fixture.componentRef.setInput("workspace", { ...mockWorkspace, role: "MEMBER" });
    expect(component.roleBadgeClass()).toContain("soft-stone");

    fixture.componentRef.setInput("workspace", { ...mockWorkspace, role: "CLIENT" });
    expect(component.roleBadgeClass()).toContain("slate");

    fixture.componentRef.setInput("workspace", { ...mockWorkspace, role: undefined });
    expect(component.roleBadgeClass()).toContain("muted");
  });

  it("should render active ribbon when isActive is true", () => {
    fixture.componentRef.setInput("isActive", true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("ACTIVE");
    expect(compiled.textContent).toContain("Enter");
  });
});
