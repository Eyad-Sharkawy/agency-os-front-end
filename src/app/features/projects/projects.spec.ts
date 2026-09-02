import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../core/api/models/client.models";
import { ProjectResponse } from "../../core/api/models/project.models";
import { ProjectsComponent } from "./projects";
import {
  ProjectFilterStatus,
  ProjectManagement,
  ProjectViewMode,
} from "./services/project-management";

describe("ProjectsComponent", () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  let pmMock: {
    projects: ReturnType<typeof signal<ProjectResponse[]>>;
    clients: ReturnType<typeof signal<ClientResponse[]>>;
    filteredProjects: ReturnType<typeof signal<ProjectResponse[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    searchQuery: ReturnType<typeof signal<string>>;
    statusFilter: ReturnType<typeof signal<ProjectFilterStatus>>;
    clientFilter: ReturnType<typeof signal<string>>;
    viewMode: ReturnType<typeof signal<ProjectViewMode>>;
    canCreate: ReturnType<typeof signal<boolean>>;
    canEdit: ReturnType<typeof signal<boolean>>;
    canDelete: ReturnType<typeof signal<boolean>>;
    isCreateModalOpen: ReturnType<typeof signal<boolean>>;
    isEditModalOpen: ReturnType<typeof signal<boolean>>;
    isDeleteModalOpen: ReturnType<typeof signal<boolean>>;
    selectedProject: ReturnType<typeof signal<ProjectResponse | null>>;
    stats: ReturnType<
      typeof signal<{
        total: number;
        inProgress: number;
        planning: number;
        onHold: number;
        delivered: number;
        totalBudget: number;
      }>
    >;
    loadProjects: ReturnType<typeof vi.fn>;
    openCreateModal: ReturnType<typeof vi.fn>;
    openEditModal: ReturnType<typeof vi.fn>;
    openDeleteModal: ReturnType<typeof vi.fn>;
    closeModals: ReturnType<typeof vi.fn>;
    setSearchQuery: ReturnType<typeof vi.fn>;
    setStatusFilter: ReturnType<typeof vi.fn>;
    setClientFilter: ReturnType<typeof vi.fn>;
    setViewMode: ReturnType<typeof vi.fn>;
    getClientName: ReturnType<typeof vi.fn>;
  };

  const mockClients: ClientResponse[] = [
    {
      id: "client-1",
      name: "Acme Corp",
      email: "contact@acme.com",
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  const mockProjects: ProjectResponse[] = [
    {
      id: "proj-1",
      name: "Enterprise Architecture",
      description: "Cloud modernization and API platform",
      budget: 35000,
      billingRate: 175,
      status: "IN_PROGRESS",
      clientId: "client-1",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ];

  beforeEach(async () => {
    pmMock = {
      projects: signal<ProjectResponse[]>(mockProjects),
      clients: signal<ClientResponse[]>(mockClients),
      filteredProjects: signal<ProjectResponse[]>(mockProjects),
      isLoading: signal<boolean>(false),
      errorMessage: signal<string | null>(null),
      searchQuery: signal<string>(""),
      statusFilter: signal<ProjectFilterStatus>("ALL"),
      clientFilter: signal<string>("ALL"),
      viewMode: signal<ProjectViewMode>("grid"),
      canCreate: signal<boolean>(true),
      canEdit: signal<boolean>(true),
      canDelete: signal<boolean>(true),
      isCreateModalOpen: signal<boolean>(false),
      isEditModalOpen: signal<boolean>(false),
      isDeleteModalOpen: signal<boolean>(false),
      selectedProject: signal<ProjectResponse | null>(null),
      stats: signal({
        total: 1,
        inProgress: 1,
        planning: 0,
        onHold: 0,
        delivered: 0,
        totalBudget: 35000,
      }),
      loadProjects: vi.fn(),
      openCreateModal: vi.fn(),
      openEditModal: vi.fn(),
      openDeleteModal: vi.fn(),
      closeModals: vi.fn(),
      setSearchQuery: vi.fn(),
      setStatusFilter: vi.fn(),
      setClientFilter: vi.fn(),
      setViewMode: vi.fn(),
      getClientName: vi.fn().mockReturnValue("Acme Corp"),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [provideRouter([]), { provide: ProjectManagement, useValue: pmMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create projects component and load projects on init", () => {
    expect(component).toBeTruthy();
    expect(pmMock.loadProjects).toHaveBeenCalled();
  });

  it("should render page header, stats ribbon and project card in grid view", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Projects");
    expect(compiled.textContent).toContain("New Project");
    expect(compiled.textContent).toContain("Total Projects");
    expect(compiled.textContent).toContain("In Progress");
    expect(compiled.textContent).toContain("Enterprise Architecture");
  });

  it("should render table view when viewMode is 'table'", () => {
    pmMock.viewMode.set("table");
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector("table");
    expect(table).not.toBeNull();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Enterprise Architecture");
    expect(compiled.textContent).toContain("Acme Corp");
  });

  it("should render empty state when no projects exist", () => {
    pmMock.projects.set([]);
    pmMock.filteredProjects.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("No projects yet");
    expect(compiled.textContent).toContain("Create First Project");
  });

  it("should render filtered empty state when search finds no results", () => {
    pmMock.projects.set(mockProjects);
    pmMock.filteredProjects.set([]);
    pmMock.searchQuery.set("Nonexistent");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("No matching projects");
    expect(compiled.textContent).toContain("Reset Filters");
  });

  it("should call PM methods on search and filter events", () => {
    component.onSearch("test");
    expect(pmMock.setSearchQuery).toHaveBeenCalledWith("test");

    component.onStatusFilter("IN_PROGRESS");
    expect(pmMock.setStatusFilter).toHaveBeenCalledWith("IN_PROGRESS");

    component.onClientFilter("client-1");
    expect(pmMock.setClientFilter).toHaveBeenCalledWith("client-1");

    component.onViewMode("table");
    expect(pmMock.setViewMode).toHaveBeenCalledWith("table");
  });
});
