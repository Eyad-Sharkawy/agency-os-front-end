import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../../core/api/models/client.models";
import { WorkspaceInvitationResponse } from "../../../../core/api/models/invitation.models";
import { ClientManagement } from "../../services/client-management";
import { ClientInviteModal } from "./client-invite-modal";

describe("ClientInviteModal", () => {
  let component: ClientInviteModal;
  let fixture: ComponentFixture<ClientInviteModal>;
  let cmMock: {
    isInviteModalOpen: ReturnType<typeof vi.fn>;
    selectedClient: ReturnType<typeof vi.fn>;
    isInviting: ReturnType<typeof vi.fn>;
    inviteSuccess: ReturnType<typeof vi.fn>;
    inviteError: ReturnType<typeof vi.fn>;
    inviteTarget: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
    inviteClientUser: ReturnType<typeof vi.fn>;
  };

  const mockClient: ClientResponse = {
    id: "c-1",
    name: "Acme Corp",
    email: "billing@acme.com",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const mockInviteResponse: WorkspaceInvitationResponse = {
    id: "inv-1",
    workspaceId: "ws-1",
    workspaceName: "Test Workspace",
    username: "acme_user",
    invitedByUsername: "admin",
    role: "CLIENT",
    clientId: "c-1",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    cmMock = {
      isInviteModalOpen: vi.fn().mockReturnValue(true),
      selectedClient: vi.fn().mockReturnValue(mockClient),
      isInviting: vi.fn().mockReturnValue(false),
      inviteSuccess: vi.fn().mockReturnValue(null),
      inviteError: vi.fn().mockReturnValue(null),
      inviteTarget: vi.fn().mockReturnValue("billing@acme.com"),
      closeModals: vi.fn(),
      inviteClientUser: vi.fn().mockReturnValue(of(mockInviteResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [ClientInviteModal],
      providers: [{ provide: ClientManagement, useValue: cmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientInviteModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and initialize target input", () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(true);
    expect(component.client()?.name).toBe("Acme Corp");
  });

  it("should validate input correctly for emails and usernames", () => {
    component.targetInput.set("");
    expect(component.isTargetValid()).toBe(false);

    component.targetInput.set("ab");
    expect(component.isTargetValid()).toBe(false);

    component.targetInput.set("acme_admin");
    expect(component.isTargetValid()).toBe(true);

    component.targetInput.set("invalid-email@");
    expect(component.isTargetValid()).toBe(false);

    component.targetInput.set("user@acme.com");
    expect(component.isTargetValid()).toBe(true);
  });

  it("should submit invitation when valid", () => {
    component.targetInput.set("user@acme.com");
    component.onSubmit();
    expect(cmMock.inviteClientUser).toHaveBeenCalledWith("user@acme.com");
  });

  it("should close modal when onClose is called", () => {
    component.onClose();
    expect(cmMock.closeModals).toHaveBeenCalled();
  });
});
