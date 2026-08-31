import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../core/api/models/client.models";
import { ClientsComponent } from "./clients";
import { ClientManagement } from "./services/client-management";

describe("ClientsComponent", () => {
  let component: ClientsComponent;
  let fixture: ComponentFixture<ClientsComponent>;
  let cmMock: {
    clients: ReturnType<typeof signal<ClientResponse[]>>;
    filteredClients: ReturnType<typeof signal<ClientResponse[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    searchQuery: ReturnType<typeof signal<string>>;
    statusFilter: ReturnType<typeof signal<string>>;
    viewMode: ReturnType<typeof signal<string>>;
    stats: ReturnType<typeof signal<{ total: number; active: number; inactive: number }>>;
    canCreate: ReturnType<typeof signal<boolean>>;
    canEdit: ReturnType<typeof signal<boolean>>;
    canDelete: ReturnType<typeof signal<boolean>>;
    canInviteClient: ReturnType<typeof signal<boolean>>;
    isCreateModalOpen: ReturnType<typeof signal<boolean>>;
    isEditModalOpen: ReturnType<typeof signal<boolean>>;
    isDeleteModalOpen: ReturnType<typeof signal<boolean>>;
    isInviteModalOpen: ReturnType<typeof signal<boolean>>;
    selectedClient: ReturnType<typeof signal<ClientResponse | null>>;
    inviteTarget: ReturnType<typeof signal<string>>;
    isInviting: ReturnType<typeof signal<boolean>>;
    inviteSuccess: ReturnType<typeof signal<string | null>>;
    inviteError: ReturnType<typeof signal<string | null>>;
    loadClients: ReturnType<typeof vi.fn>;
    openCreateModal: ReturnType<typeof vi.fn>;
    openEditModal: ReturnType<typeof vi.fn>;
    openDeleteModal: ReturnType<typeof vi.fn>;
    openInviteModal: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
    inviteClientUser: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    setStatusFilter: ReturnType<typeof vi.fn>;
    setViewMode: ReturnType<typeof vi.fn>;
    getInitials: ReturnType<typeof vi.fn>;
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
  ];

  beforeEach(async () => {
    cmMock = {
      clients: signal(mockClients),
      filteredClients: signal(mockClients),
      isLoading: signal(false),
      errorMessage: signal(null),
      searchQuery: signal(""),
      statusFilter: signal("ALL"),
      viewMode: signal("grid"),
      stats: signal({ total: 1, active: 1, inactive: 0 }),
      canCreate: signal(true),
      canEdit: signal(true),
      canDelete: signal(true),
      canInviteClient: signal(true),
      isCreateModalOpen: signal(false),
      isEditModalOpen: signal(false),
      isDeleteModalOpen: signal(false),
      isInviteModalOpen: signal(false),
      selectedClient: signal(null),
      inviteTarget: signal(""),
      isInviting: signal(false),
      inviteSuccess: signal(null),
      inviteError: signal(null),
      loadClients: vi.fn(),
      openCreateModal: vi.fn(),
      openEditModal: vi.fn(),
      openDeleteModal: vi.fn(),
      openInviteModal: vi.fn(),
      closeModals: vi.fn(),
      inviteClientUser: vi.fn(),
      setSearchQuery: vi.fn(),
      setStatusFilter: vi.fn(),
      setViewMode: vi.fn(),
      getInitials: vi.fn().mockReturnValue("AC"),
    };

    await TestBed.configureTestingModule({
      imports: [ClientsComponent],
      providers: [provideRouter([]), { provide: ClientManagement, useValue: cmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create clients component and load clients on init", () => {
    expect(component).toBeTruthy();
    expect(cmMock.loadClients).toHaveBeenCalled();
  });

  it("should render client directory title and stats", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Clients");
    expect(compiled.textContent).toContain("Total Clients");
    expect(compiled.textContent).toContain("Active Accounts");
    expect(compiled.textContent).toContain("Acme Corp");
  });

  it("should forward search and filter actions to service", () => {
    component.onSearch("test");
    expect(cmMock.setSearchQuery).toHaveBeenCalledWith("test");

    component.onStatusFilter("ACTIVE");
    expect(cmMock.setStatusFilter).toHaveBeenCalledWith("ACTIVE");

    component.onViewMode("table");
    expect(cmMock.setViewMode).toHaveBeenCalledWith("table");
  });
});
