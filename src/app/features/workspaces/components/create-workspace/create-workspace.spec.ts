import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { CreateWorkspace } from "./create-workspace";
import { WorkspaceApi } from "../../../../core/api/services/workspace/workspace-api";
import { WorkspaceStore } from "../../../../core/multitenancy/workspace.store";
import { AuthStore } from "../../../../core/auth/stores/auth.store";
import { ENVIRONMENT } from "../../../../core/tokens/enviroment/environment.token";
import { LOCAL_STORAGE } from "../../../../core/tokens/local-storage/local-storage.token";

describe("CreateWorkspace Component", () => {
  let component: CreateWorkspace;
  let workspaceServiceMock: {
    createWorkspace: ReturnType<typeof vi.fn>;
    getWorkspaces: ReturnType<typeof vi.fn>;
  };
  let workspaceStore: InstanceType<typeof WorkspaceStore>;
  let authStore: InstanceType<typeof AuthStore>;
  let router: Router;

  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com/api/v1",
    wsUrl: "wss://api.example.com/ws",
    keycloak: { url: "", realm: "", clientId: "" },
  };

  beforeEach(async () => {
    workspaceServiceMock = {
      createWorkspace: vi.fn().mockReturnValue(
        of({
          id: "w-new",
          name: "Apex Labs",
          tenantId: "tenant_apex_labs",
          contactEmail: "admin@apexlabs.com",
          role: "OWNER",
          isActive: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        }),
      ),
      getWorkspaces: vi.fn().mockReturnValue(of([])),
    };

    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    await TestBed.configureTestingModule({
      imports: [CreateWorkspace],
      providers: [
        provideRouter([]),
        { provide: WorkspaceApi, useValue: workspaceServiceMock },
        { provide: ENVIRONMENT, useValue: mockEnv },
        { provide: LOCAL_STORAGE, useValue: mockStorage },
        WorkspaceStore,
        AuthStore,
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, "navigate").mockResolvedValue(true);

    workspaceStore = TestBed.inject(WorkspaceStore);
    authStore = TestBed.inject(AuthStore);
    vi.spyOn(authStore, "userEmail").mockReturnValue("admin@apexlabs.com");

    const fixture = TestBed.createComponent(CreateWorkspace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and initialize default values", () => {
    expect(component).toBeTruthy();
    expect(component.workspaceName()).toBe("");
    expect(component.isSubmitting()).toBe(false);
  });

  it("should compute slug preview from workspace name", () => {
    expect(component.slugPreview()).toBe("tenant_your_workspace");

    component.workspaceName.set("Apex Digital Labs");
    expect(component.slugPreview()).toBe("tenant_apex_digital_labs");
  });

  it("should compute initials preview from workspace name", () => {
    expect(component.initialsPreview()).toBe("WS");

    component.workspaceName.set("Apex Digital Labs");
    expect(component.initialsPreview()).toBe("AD");

    component.workspaceName.set("Apex");
    expect(component.initialsPreview()).toBe("AP");
  });

  it("should evaluate isFormValid based on workspace name", () => {
    expect(component.isFormValid()).toBe(false);

    component.workspaceName.set("A");
    expect(component.isFormValid()).toBe(false);

    component.workspaceName.set("Apex Labs");
    expect(component.isFormValid()).toBe(true);
  });

  it("should submit workspace creation successfully with auth email, update store and navigate", () => {
    const setActiveSpy = vi.spyOn(workspaceStore, "setActiveWorkspace");

    component.workspaceName.set("Apex Labs");

    component.onSubmit();

    expect(workspaceServiceMock.createWorkspace).toHaveBeenCalledWith({
      name: "Apex Labs",
      contactEmail: "admin@apexlabs.com",
    });
    expect(setActiveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: "w-new", name: "Apex Labs" }),
    );
    expect(router.navigate).toHaveBeenCalledWith(["/"]);
  });

  it("should handle creation error and display message", () => {
    workspaceServiceMock.createWorkspace.mockReturnValue(
      throwError(() => ({ error: { detail: "Workspace name is already taken" } })),
    );

    component.workspaceName.set("Apex Labs");

    component.onSubmit();

    expect(component.errorMessage()).toBe("Workspace name is already taken");
    expect(component.isSubmitting()).toBe(false);
  });

  it("should not submit if form is invalid", () => {
    component.workspaceName.set("");

    component.onSubmit();

    expect(workspaceServiceMock.createWorkspace).not.toHaveBeenCalled();
  });
});
