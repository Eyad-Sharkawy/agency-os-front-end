import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../core/api/models/client.models";
import { ClientApi } from "../../../core/api/services/client/client-api";
import { InvitationApi } from "../../../core/api/services/invitation/invitation-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";
import { ClientManagement } from "./client-management";

describe("ClientManagement", () => {
  let service: ClientManagement;
  let router: Router;
  let clientApiMock: {
    getClients: ReturnType<typeof vi.fn>;
    getClientById: ReturnType<typeof vi.fn>;
    createClient: ReturnType<typeof vi.fn>;
    updateClient: ReturnType<typeof vi.fn>;
    deleteClient: ReturnType<typeof vi.fn>;
  };
  let invitationApiMock: {
    inviteUser: ReturnType<typeof vi.fn>;
  };
  let workspaceStoreMock: {
    activeWorkspace: ReturnType<typeof vi.fn>;
    activeTenantId: ReturnType<typeof vi.fn>;
  };

  const mockClients: ClientResponse[] = [
    {
      id: "c-1",
      name: "Acme Corp",
      email: "contact@acme.com",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "c-2",
      name: "Beta Inc",
      email: "hello@beta.com",
      status: "INACTIVE",
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-02-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    clientApiMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
      getClientById: vi
        .fn()
        .mockImplementation((id: string) =>
          of(mockClients.find(c => c.id === id) || mockClients[0]),
        ),
      createClient: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
    };

    invitationApiMock = {
      inviteUser: vi.fn().mockReturnValue(of({ id: "inv-1", status: "PENDING" })),
    };

    workspaceStoreMock = {
      activeWorkspace: vi.fn().mockReturnValue({ role: "OWNER" }),
      activeTenantId: vi.fn().mockReturnValue("tenant-123"),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ClientManagement,
        { provide: ClientApi, useValue: clientApiMock },
        { provide: InvitationApi, useValue: invitationApiMock },
        { provide: WorkspaceStore, useValue: workspaceStoreMock },
      ],
    });

    service = TestBed.inject(ClientManagement);
    router = TestBed.inject(Router);
  });

  it("should initialize with default states", () => {
    expect(service.clients()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.searchQuery()).toBe("");
    expect(service.statusFilter()).toBe("ALL");
    expect(service.viewMode()).toBe("grid");
    expect(service.canCreate()).toBe(true);
    expect(service.canEdit()).toBe(true);
    expect(service.canDelete()).toBe(true);
    expect(service.canInviteClient()).toBe(true);
  });

  it("should load clients successfully", () => {
    service.loadClients();
    expect(clientApiMock.getClients).toHaveBeenCalled();
    expect(service.clients()).toHaveLength(2);
    expect(service.isLoading()).toBe(false);
    expect(service.errorMessage()).toBeNull();
  });

  it("should handle error when loading clients fails", () => {
    clientApiMock.getClients.mockReturnValue(throwError(() => new Error("Network error")));
    service.loadClients();
    expect(service.isLoading()).toBe(false);
    expect(service.errorMessage()).toContain("Network error");
  });

  it("should filter clients by search query", () => {
    service.clients.set(mockClients);
    service.setSearchQuery("acme");
    expect(service.filteredClients()).toHaveLength(1);
    expect(service.filteredClients()[0].name).toBe("Acme Corp");
  });

  it("should filter clients by status", () => {
    service.clients.set(mockClients);
    service.setStatusFilter("INACTIVE");
    expect(service.filteredClients()).toHaveLength(1);
    expect(service.filteredClients()[0].name).toBe("Beta Inc");
  });

  it("should compute stats correctly", () => {
    service.clients.set(mockClients);
    expect(service.stats()).toEqual({
      total: 2,
      active: 1,
      inactive: 1,
    });
  });

  it("should create a client and prepend to list", () => {
    const newClient: ClientResponse = {
      id: "c-3",
      name: "Gamma LLC",
      email: "info@gamma.com",
      status: "ACTIVE",
      createdAt: "2026-03-01T00:00:00Z",
      updatedAt: "2026-03-01T00:00:00Z",
    };
    clientApiMock.createClient.mockReturnValue(of(newClient));

    service.clients.set(mockClients);
    service
      .createClient({ name: "Gamma LLC", email: "info@gamma.com", status: "ACTIVE" })
      .subscribe();

    expect(service.clients()).toHaveLength(3);
    expect(service.clients()[0].id).toBe("c-3");
  });

  it("should update an existing client in the list", () => {
    const updatedClient: ClientResponse = {
      ...mockClients[0],
      name: "Acme Super Corp",
    };
    clientApiMock.updateClient.mockReturnValue(of(updatedClient));

    service.clients.set(mockClients);
    service
      .updateClient("c-1", { name: "Acme Super Corp", email: "contact@acme.com", status: "ACTIVE" })
      .subscribe();

    expect(service.clients().find(c => c.id === "c-1")?.name).toBe("Acme Super Corp");
  });

  it("should delete a client and remove from list", () => {
    clientApiMock.deleteClient.mockReturnValue(of(undefined));

    service.clients.set(mockClients);
    service.deleteClient("c-1").subscribe();

    expect(service.clients()).toHaveLength(1);
    expect(service.clients().find(c => c.id === "c-1")).toBeUndefined();
  });

  it("should navigate with query params for modal states", () => {
    const navigateSpy = vi.spyOn(router, "navigate");

    service.openCreateModal();
    expect(navigateSpy).toHaveBeenCalledWith([], {
      queryParams: { action: "create", clientId: null },
      queryParamsHandling: "merge",
    });

    service.openEditModal(mockClients[0]);
    expect(navigateSpy).toHaveBeenCalledWith([], {
      queryParams: { action: "edit", clientId: "c-1" },
      queryParamsHandling: "merge",
    });

    service.openDeleteModal(mockClients[1]);
    expect(navigateSpy).toHaveBeenCalledWith([], {
      queryParams: { action: "delete", clientId: "c-2" },
      queryParamsHandling: "merge",
    });

    service.openInviteModal(mockClients[0]);
    expect(navigateSpy).toHaveBeenCalledWith([], {
      queryParams: { action: "invite", clientId: "c-1" },
      queryParamsHandling: "merge",
    });

    service.closeModals();
    expect(navigateSpy).toHaveBeenCalledWith([], {
      queryParams: { action: null, clientId: null },
      queryParamsHandling: "merge",
    });
  });

  it("should invite a client user and set success message", () => {
    service.selectedClient.set(mockClients[0]);
    service.inviteClientUser("user@acme.com").subscribe();

    expect(invitationApiMock.inviteUser).toHaveBeenCalledWith("tenant-123", {
      email: "user@acme.com",
      username: undefined,
      role: "CLIENT",
      clientId: "c-1",
    });
    expect(service.inviteSuccess()).toContain("user@acme.com");
    expect(service.isInviting()).toBe(false);
  });

  it("should generate proper initials", () => {
    expect(service.getInitials("Acme Corporation")).toBe("AC");
    expect(service.getInitials("Globex")).toBe("GL");
    expect(service.getInitials("")).toBe("CL");
  });
});
