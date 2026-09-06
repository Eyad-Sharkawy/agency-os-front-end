import { signal, WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientResponse } from "../../../core/api/models/client.models";
import { ProjectRequest, ProjectResponse } from "../../../core/api/models/project.models";
import { ClientApi } from "../../../core/api/services/client/client-api";
import { ProjectApi } from "../../../core/api/services/project/project-api";
import { TaskApi } from "../../../core/api/services/task/task-api";
import { WorkspaceStore } from "../../../core/multitenancy/workspace.store";
import { ProjectManagement } from "./project-management";

describe("ProjectManagement", () => {
  let service: ProjectManagement;
  let router: Router;
  let projectApiMock: {
    getProjects: ReturnType<typeof vi.fn>;
    getProjectById: ReturnType<typeof vi.fn>;
    createProject: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
    deleteProject: ReturnType<typeof vi.fn>;
  };
  let clientApiMock: {
    getClients: ReturnType<typeof vi.fn>;
  };
  let taskApiMock: {
    getTasks: ReturnType<typeof vi.fn>;
  };
  let activeWorkspaceSignal: WritableSignal<{ role: string } | null>;
  let workspaceStoreMock: {
    activeWorkspace: WritableSignal<{ role: string } | null>;
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
    {
      id: "client-2",
      name: "Globex Ltd",
      email: "info@globex.com",
      status: "ACTIVE",
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    },
  ];

  const mockProjects: ProjectResponse[] = [
    {
      id: "proj-1",
      name: "Alpha Redesign",
      description: "Complete redesign of marketing website",
      budget: 12000,
      billingRate: 150,
      status: "IN_PROGRESS",
      clientId: "client-1",
      createdAt: "2026-01-05T00:00:00Z",
      updatedAt: "2026-01-05T00:00:00Z",
    },
    {
      id: "proj-2",
      name: "Beta Mobile App",
      description: "Flutter mobile application",
      budget: 25000,
      billingRate: 175,
      status: "PLANNING",
      clientId: "client-2",
      createdAt: "2026-01-10T00:00:00Z",
      updatedAt: "2026-01-10T00:00:00Z",
    },
    {
      id: "proj-3",
      name: "Gamma SEO",
      description: "Search engine optimization audit",
      budget: 5000,
      billingRate: 120,
      status: "DELIVERED",
      clientId: "client-1",
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-01-15T00:00:00Z",
    },
  ];

  beforeEach(() => {
    activeWorkspaceSignal = signal<{ role: string } | null>({ role: "OWNER" });

    projectApiMock = {
      getProjects: vi.fn().mockReturnValue(of(mockProjects)),
      getProjectById: vi
        .fn()
        .mockImplementation((id: string) =>
          of(mockProjects.find(p => p.id === id) || mockProjects[0]),
        ),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
    };

    clientApiMock = {
      getClients: vi.fn().mockReturnValue(of(mockClients)),
    };

    taskApiMock = {
      getTasks: vi.fn().mockReturnValue(of([])),
    };

    workspaceStoreMock = {
      activeWorkspace: activeWorkspaceSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ProjectManagement,
        { provide: ProjectApi, useValue: projectApiMock },
        { provide: ClientApi, useValue: clientApiMock },
        { provide: TaskApi, useValue: taskApiMock },
        { provide: WorkspaceStore, useValue: workspaceStoreMock },
      ],
    });

    service = TestBed.inject(ProjectManagement);
    router = TestBed.inject(Router);
  });

  it("should initialize with default states", () => {
    expect(service.projects()).toEqual([]);
    expect(service.clients()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.searchQuery()).toBe("");
    expect(service.statusFilter()).toBe("ALL");
    expect(service.clientFilter()).toBe("ALL");
    expect(service.viewMode()).toBe("grid");
    expect(service.canCreate()).toBe(true);
    expect(service.canEdit()).toBe(true);
    expect(service.canDelete()).toBe(true);
  });

  it("should load projects and clients successfully", () => {
    service.loadProjects();

    expect(service.isLoading()).toBe(false);
    expect(service.projects()).toEqual(mockProjects);
    expect(service.clients()).toEqual(mockClients);
    expect(service.stats().total).toBe(3);
    expect(service.stats().inProgress).toBe(1);
    expect(service.stats().planning).toBe(1);
    expect(service.stats().delivered).toBe(1);
    expect(service.stats().totalBudget).toBe(42000);
  });

  it("should handle error during loadProjects", () => {
    projectApiMock.getProjects.mockReturnValue(
      throwError(() => ({ error: { detail: "Failed to fetch" } })),
    );

    service.loadProjects();

    expect(service.isLoading()).toBe(false);
    expect(service.errorMessage()).toBe("Failed to fetch");
  });

  it("should filter projects by search query (matches name, description, client name)", () => {
    service.projects.set(mockProjects);
    service.clients.set(mockClients);

    service.setSearchQuery("Alpha");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-1");

    service.setSearchQuery("Flutter");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-2");

    service.setSearchQuery("Globex");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-2");

    service.setSearchQuery("Nonexistent");
    expect(service.filteredProjects()).toHaveLength(0);
  });

  it("should filter projects by status", () => {
    service.projects.set(mockProjects);

    service.setStatusFilter("IN_PROGRESS");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-1");

    service.setStatusFilter("PLANNING");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-2");

    service.setStatusFilter("DELIVERED");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-3");

    service.setStatusFilter("ON_HOLD");
    expect(service.filteredProjects()).toHaveLength(0);
  });

  it("should filter projects by client", () => {
    service.projects.set(mockProjects);

    service.setClientFilter("client-1");
    expect(service.filteredProjects()).toHaveLength(2);

    service.setClientFilter("client-2");
    expect(service.filteredProjects()).toHaveLength(1);
  });

  it("should create project and prepend to list", () => {
    service.projects.set(mockProjects);

    const newProject: ProjectResponse = {
      id: "proj-4",
      name: "Delta Consulting",
      budget: 8000,
      billingRate: 200,
      status: "PLANNING",
      clientId: "client-2",
      createdAt: "2026-02-01T00:00:00Z",
      updatedAt: "2026-02-01T00:00:00Z",
    };

    projectApiMock.createProject.mockReturnValue(of(newProject));

    const req: ProjectRequest = {
      name: "Delta Consulting",
      budget: 8000,
      billingRate: 200,
      status: "PLANNING",
      clientId: "client-2",
    };

    service.createProject(req).subscribe(result => {
      expect(result).toEqual(newProject);
    });

    expect(service.projects()).toHaveLength(4);
    expect(service.projects()[0].id).toBe("proj-4");
  });

  it("should update existing project in list", () => {
    service.projects.set(mockProjects);

    const updated: ProjectResponse = {
      ...mockProjects[0],
      name: "Alpha Redesign V2",
      budget: 15000,
    };

    projectApiMock.updateProject.mockReturnValue(of(updated));

    service
      .updateProject("proj-1", {
        name: "Alpha Redesign V2",
        budget: 15000,
        billingRate: 150,
        status: "IN_PROGRESS",
        clientId: "client-1",
      })
      .subscribe(result => {
        expect(result.name).toBe("Alpha Redesign V2");
      });

    expect(service.projects().find(p => p.id === "proj-1")?.name).toBe("Alpha Redesign V2");
  });

  it("should delete project from list", () => {
    service.projects.set(mockProjects);
    projectApiMock.deleteProject.mockReturnValue(of(undefined));

    service.deleteProject("proj-1").subscribe();

    expect(service.projects()).toHaveLength(2);
    expect(service.projects().find(p => p.id === "proj-1")).toBeUndefined();
  });

  it("should open and close modals properly", () => {
    const navigateSpy = vi.spyOn(router, "navigate");

    service.openCreateModal();
    expect(service.isCreateModalOpen()).toBe(true);
    expect(service.selectedProject()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { action: "create", projectId: null },
      }),
    );

    service.openEditModal(mockProjects[0]);
    expect(service.isEditModalOpen()).toBe(true);
    expect(service.selectedProject()).toEqual(mockProjects[0]);

    service.openDeleteModal(mockProjects[0]);
    expect(service.isDeleteModalOpen()).toBe(true);
    expect(service.selectedProject()).toEqual(mockProjects[0]);

    service.closeModals();
    expect(service.isCreateModalOpen()).toBe(false);
    expect(service.isEditModalOpen()).toBe(false);
    expect(service.isDeleteModalOpen()).toBe(false);
    expect(service.selectedProject()).toBeNull();
  });

  it("should restrict permissions based on workspace role", () => {
    activeWorkspaceSignal.set({ role: "ADMIN" });
    expect(service.canCreate()).toBe(true);
    expect(service.canEdit()).toBe(true);
    expect(service.canDelete()).toBe(false);

    activeWorkspaceSignal.set({ role: "MEMBER" });
    expect(service.canCreate()).toBe(false);
    expect(service.canEdit()).toBe(false);
    expect(service.canDelete()).toBe(false);
  });

  it("should compute isModalOpen accurately based on create and edit signals", () => {
    service.isCreateModalOpen.set(true);
    expect(service.isModalOpen()).toBe(true);
    service.isCreateModalOpen.set(false);
    service.isEditModalOpen.set(true);
    expect(service.isModalOpen()).toBe(true);
    service.isEditModalOpen.set(false);
    expect(service.isModalOpen()).toBe(false);
  });

  it("should return client name or fallback to 'Unknown Client'", () => {
    service.clients.set(mockClients);
    expect(service.getClientName("client-1")).toBe("Acme Corp");
    expect(service.getClientName("nonexistent-id")).toBe("Unknown Client");
  });

  it("should load clients independently via loadClients", () => {
    service.loadClients();
    expect(service.clients()).toEqual(mockClients);

    clientApiMock.getClients.mockReturnValue(throwError(() => new Error("Client error")));
    service.loadClients();
    // Does not crash
    expect(service.clients()).toEqual(mockClients);
  });

  it("should handle error messages when error is an Error instance", () => {
    projectApiMock.getProjects.mockReturnValue(throwError(() => new Error("Network timeout")));
    service.loadProjects();
    expect(service.errorMessage()).toBe("Network timeout");

    projectApiMock.getProjects.mockReturnValue(throwError(() => "Unknown failure"));
    service.loadProjects();
    expect(service.errorMessage()).toBe("Failed to load projects.");
  });

  it("should compute stats correctly including onHold status", () => {
    service.projects.set([
      ...mockProjects,
      {
        id: "proj-hold",
        name: "Hold Project",
        status: "ON_HOLD",
        clientId: "client-1",
        budget: 1000,
        billingRate: 100,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    expect(service.stats().onHold).toBe(1);
    expect(service.stats().total).toBe(4);
    expect(service.stats().totalBudget).toBe(43000);
  });

  it("should not open modals when unauthorized", () => {
    activeWorkspaceSignal.set({ role: "CLIENT" });

    service.openCreateModal();
    expect(service.isCreateModalOpen()).toBe(false);

    service.openEditModal(mockProjects[0]);
    expect(service.isEditModalOpen()).toBe(false);

    service.openDeleteModal(mockProjects[0]);
    expect(service.isDeleteModalOpen()).toBe(false);
  });

  it("should filter projects by client and status", () => {
    service.loadProjects();

    service.setClientFilter("client-2");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-2");

    service.setClientFilter("ALL");
    service.setStatusFilter("DELIVERED");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-3");
  });

  it("should search projects by description and client name", () => {
    service.loadProjects();

    service.setSearchQuery("marketing");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-1");

    service.setSearchQuery("Globex");
    expect(service.filteredProjects()).toHaveLength(1);
    expect(service.filteredProjects()[0].id).toBe("proj-2");
  });

  it("should set view mode", () => {
    service.setViewMode("table");
    expect(service.viewMode()).toBe("table");
  });

  it("should create, update, and delete projects", () => {
    service.loadProjects();

    const newProject: ProjectResponse = {
      id: "proj-new",
      name: "New Project",
      status: "PLANNING",
      clientId: "client-1",
      budget: 10000,
      billingRate: 150,
      createdAt: "2026-01-20T00:00:00Z",
      updatedAt: "2026-01-20T00:00:00Z",
    };
    const req: ProjectRequest = {
      name: "New Project",
      status: "PLANNING",
      clientId: "client-1",
      billingRate: 150,
    };
    projectApiMock.createProject.mockReturnValue(of(newProject));
    service.createProject(req).subscribe();
    expect(service.projects().find(p => p.id === "proj-new")).toBeTruthy();

    const updatedProject = { ...newProject, name: "Updated Name" };
    projectApiMock.updateProject.mockReturnValue(of(updatedProject));
    service.updateProject("proj-new", { ...req, name: "Updated Name" }).subscribe();
    expect(service.projects().find(p => p.id === "proj-new")?.name).toBe("Updated Name");

    projectApiMock.deleteProject.mockReturnValue(of(undefined));
    service.deleteProject("proj-new").subscribe();
    expect(service.projects().find(p => p.id === "proj-new")).toBeUndefined();
  });

  it("should extract error detail on loadProjects error", () => {
    projectApiMock.getProjects.mockReturnValue(
      throwError(() => ({ error: { detail: "Access denied to project list" } })),
    );
    service.loadProjects();
    expect(service.errorMessage()).toBe("Access denied to project list");
  });

  describe("URL Action State & Modal Sync", () => {
    const syncState = (params: Record<string, unknown>) =>
      (
        service as unknown as { syncUrlActionState: (p: Record<string, unknown>) => void }
      ).syncUrlActionState(params);

    beforeEach(() => {
      service.projects.set(mockProjects);
    });

    it("should open create modal on create action if allowed", () => {
      syncState({ action: "create" });
      expect(service.isCreateModalOpen()).toBe(true);
      expect(service.selectedProject()).toBeNull();
    });

    it("should open edit modal on edit action if project found", () => {
      syncState({ action: "edit", projectId: "proj-1" });
      expect(service.isEditModalOpen()).toBe(true);
      expect(service.selectedProject()?.id).toBe("proj-1");

      // Repeated when already selected
      syncState({ action: "edit", projectId: "proj-1" });
      expect(service.isEditModalOpen()).toBe(true);
    });

    it("should open delete modal on delete action if project found", () => {
      syncState({ action: "delete", projectId: "proj-2" });
      expect(service.isDeleteModalOpen()).toBe(true);
      expect(service.selectedProject()?.id).toBe("proj-2");
    });

    it("should fetch project by id if not in memory", () => {
      service.projects.set([]);
      syncState({ action: "edit", projectId: "proj-1" });
      expect(projectApiMock.getProjectById).toHaveBeenCalledWith("proj-1");
      expect(service.isEditModalOpen()).toBe(true);
    });

    it("should close modals if fetch project fails", () => {
      service.projects.set([]);
      projectApiMock.getProjectById.mockReturnValue(throwError(() => new Error("Not found")));
      syncState({ action: "edit", projectId: "unknown" });
      expect(service.isEditModalOpen()).toBe(false);
    });

    it("should reset modals when action is absent", () => {
      service.openCreateModal();
      expect(service.isCreateModalOpen()).toBe(true);

      syncState({});
      expect(service.isCreateModalOpen()).toBe(false);
    });

    it("should not open modal if permissions are insufficient", () => {
      activeWorkspaceSignal.set({ role: "CLIENT" });
      syncState({ action: "create" });
      expect(service.isCreateModalOpen()).toBe(false);

      syncState({ action: "edit", projectId: "proj-1" });
      expect(service.isEditModalOpen()).toBe(false);

      syncState({ action: "delete", projectId: "proj-1" });
      expect(service.isDeleteModalOpen()).toBe(false);
    });
  });

  describe("Budget & Spent Tracking", () => {
    it("should calculate project spent and budget progress correctly", () => {
      service.projects.set(mockProjects);
      service.tasks.set([
        {
          id: "t-1",
          title: "Task 1",
          projectId: "proj-1",
          totalLoggedMinutes: 480, // 8 hours * 150/hr = $1200
          priority: "HIGH",
          status: "DONE",
          assigneeIds: [],
          isOverBudget: false,
          createdAt: "",
          updatedAt: "",
        },
      ]);

      expect(service.getProjectSpent("proj-1")).toBe(1200);
      const progress = service.getProjectBudgetProgress("proj-1");
      expect(progress.spent).toBe(1200);
      expect(progress.budget).toBe(12000);
      expect(progress.percentage).toBe(10);
      expect(progress.isOverBudget).toBe(false);
      expect(progress.isNearBudget).toBe(false);

      // Near budget: 84%
      service.tasks.set([
        {
          id: "t-2",
          title: "Task 2",
          projectId: "proj-3",
          totalLoggedMinutes: 2100, // 35 hrs * 120 = 4200 (84% of 5000)
          priority: "HIGH",
          status: "DONE",
          assigneeIds: [],
          isOverBudget: false,
          createdAt: "",
          updatedAt: "",
        },
      ]);
      const progressNear = service.getProjectBudgetProgress("proj-3");
      expect(progressNear.isNearBudget).toBe(true);
      expect(progressNear.isOverBudget).toBe(false);

      // Over budget: 120%
      service.tasks.set([
        {
          id: "t-3",
          title: "Task 3",
          projectId: "proj-3",
          totalLoggedMinutes: 3000, // 50 hrs * 120 = 6000
          priority: "HIGH",
          status: "DONE",
          assigneeIds: [],
          isOverBudget: false,
          createdAt: "",
          updatedAt: "",
        },
      ]);
      const progressOver = service.getProjectBudgetProgress("proj-3");
      expect(progressOver.isOverBudget).toBe(true);
      expect(progressOver.percentage).toBe(120);

      // Missing project or missing budget
      expect(service.getProjectSpent("non-existent")).toBe(0);
      const progressMissing = service.getProjectBudgetProgress("non-existent");
      expect(progressMissing.budget).toBeNull();
      expect(progressMissing.percentage).toBe(0);
    });
  });
});
