import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WorkspaceInvitations } from "./workspace-invitations";
import { WorkspaceInvitationResponse } from "../../../../core/api/models/invitation.models";

describe("WorkspaceInvitations Component", () => {
  let component: WorkspaceInvitations;
  let fixture: ComponentFixture<WorkspaceInvitations>;

  const mockInvitations: WorkspaceInvitationResponse[] = [
    {
      id: "inv-1",
      workspaceId: "w-3",
      workspaceName: "Wayne Enterprises",
      username: "johndoe",
      invitedByUsername: "bruce",
      role: "ADMIN",
      status: "PENDING",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceInvitations],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceInvitations);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("invitations", mockInvitations);
    fixture.componentRef.setInput("processingId", null);
    fixture.detectChanges();
  });

  it("should create and render invitations", () => {
    expect(component).toBeTruthy();
    expect(component.getRoleBadgeClass("ADMIN")).toContain("text-blue");
  });

  it("should emit accept event when Accept button is clicked", () => {
    let acceptedInv: WorkspaceInvitationResponse | undefined;
    component.accept.subscribe(inv => (acceptedInv = inv));

    component.onAccept(mockInvitations[0]);
    expect(acceptedInv).toEqual(mockInvitations[0]);
  });

  it("should emit decline event when Decline button is clicked", () => {
    let declinedInv: WorkspaceInvitationResponse | undefined;
    component.decline.subscribe(inv => (declinedInv = inv));

    component.onDecline(mockInvitations[0]);
    expect(declinedInv).toEqual(mockInvitations[0]);
  });
});
