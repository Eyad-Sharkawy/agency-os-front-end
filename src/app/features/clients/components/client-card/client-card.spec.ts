import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../../core/api/models/client.models";
import { ClientManagement } from "../../services/client-management";
import { ClientCard } from "./client-card";

describe("ClientCard", () => {
  let component: ClientCard;
  let fixture: ComponentFixture<ClientCard>;
  let cmMock: {
    openInviteModal: ReturnType<typeof vi.fn>;
    openEditModal: ReturnType<typeof vi.fn>;
    openDeleteModal: ReturnType<typeof vi.fn>;
    canEdit: ReturnType<typeof vi.fn>;
    canDelete: ReturnType<typeof vi.fn>;
    canInviteClient: ReturnType<typeof vi.fn>;
    getInitials: ReturnType<typeof vi.fn>;
  };

  const mockClient: ClientResponse = {
    id: "c-123",
    name: "Acme Corp",
    email: "contact@acme.com",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    cmMock = {
      openInviteModal: vi.fn(),
      openEditModal: vi.fn(),
      openDeleteModal: vi.fn(),
      canEdit: vi.fn().mockReturnValue(true),
      canDelete: vi.fn().mockReturnValue(true),
      canInviteClient: vi.fn().mockReturnValue(true),
      getInitials: vi.fn().mockReturnValue("AC"),
    };

    await TestBed.configureTestingModule({
      imports: [ClientCard],
      providers: [provideRouter([]), { provide: ClientManagement, useValue: cmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("client", mockClient);
    fixture.detectChanges();
  });

  it("should create component and render client details", () => {
    expect(component).toBeTruthy();
    expect(component.client()).toEqual(mockClient);
  });

  it("should call openInviteModal on invite", () => {
    component.onInvite();
    expect(cmMock.openInviteModal).toHaveBeenCalledWith(mockClient);
  });

  it("should call openEditModal on edit", () => {
    component.onEdit();
    expect(cmMock.openEditModal).toHaveBeenCalledWith(mockClient);
  });

  it("should call openDeleteModal on delete", () => {
    component.onDelete();
    expect(cmMock.openDeleteModal).toHaveBeenCalledWith(mockClient);
  });
});
