import { TestBed } from "@angular/core/testing";
import { AuthStore } from "./auth.store";
import { ENVIRONMENT } from "../tokens/environment.token";

const mockKeycloakInstance = {
  init: vi.fn(),
  loadUserProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  createLoginUrl: vi.fn(),
  createRegisterUrl: vi.fn(),
  isTokenExpired: vi.fn(),
  updateToken: vi.fn(),
  token: null as string | null,
  realmAccess: { roles: [] as string[] } as { roles: string[] } | undefined,
};

vi.mock("keycloak-js", () => {
  class MockKeycloak {
    init = vi.fn().mockImplementation((...args: unknown[]) => mockKeycloakInstance.init(...args));
    loadUserProfile = vi.fn().mockImplementation(() => mockKeycloakInstance.loadUserProfile());
    login = vi.fn().mockImplementation((...args: unknown[]) => mockKeycloakInstance.login(...args));
    register = vi
      .fn()
      .mockImplementation((...args: unknown[]) => mockKeycloakInstance.register(...args));
    logout = vi
      .fn()
      .mockImplementation((...args: unknown[]) => mockKeycloakInstance.logout(...args));
    createLoginUrl = vi
      .fn()
      .mockImplementation((...args: unknown[]) => mockKeycloakInstance.createLoginUrl(...args));
    createRegisterUrl = vi
      .fn()
      .mockImplementation((...args: unknown[]) => mockKeycloakInstance.createRegisterUrl(...args));
    isTokenExpired = vi
      .fn()
      .mockImplementation((...args: unknown[]) => mockKeycloakInstance.isTokenExpired(...args));
    updateToken = vi
      .fn()
      .mockImplementation((...args: unknown[]) => mockKeycloakInstance.updateToken(...args));
    get token(): string | null {
      return mockKeycloakInstance.token;
    }
    set token(val: string | null) {
      mockKeycloakInstance.token = val;
    }
    get realmAccess(): { roles: string[] } | undefined {
      return mockKeycloakInstance.realmAccess;
    }
    set realmAccess(val: { roles: string[] } | undefined) {
      mockKeycloakInstance.realmAccess = val;
    }
  }

  return {
    default: MockKeycloak,
  };
});

describe("AuthStore", () => {
  const mockEnv = {
    production: false,
    apiUrl: "https://api.example.com",
    wsUrl: "wss://api.example.com/ws",
    keycloak: {
      url: "https://auth.example.com",
      realm: "test-realm",
      clientId: "test-client",
    },
  };

  let store: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockKeycloakInstance.token = null;
    mockKeycloakInstance.realmAccess = { roles: [] };
    mockKeycloakInstance.init.mockResolvedValue(true);
    mockKeycloakInstance.loadUserProfile.mockResolvedValue({
      id: "user-123",
      username: "jdoe",
      email: "jdoe@example.com",
      firstName: "John",
      lastName: "Doe",
    });
    mockKeycloakInstance.createLoginUrl.mockResolvedValue("https://auth.example.com/login");
    mockKeycloakInstance.createRegisterUrl.mockResolvedValue("https://auth.example.com/register");
    mockKeycloakInstance.logout.mockResolvedValue(undefined);
    mockKeycloakInstance.updateToken.mockResolvedValue(true);
    mockKeycloakInstance.isTokenExpired.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [{ provide: ENVIRONMENT, useValue: mockEnv }],
    });
    store = TestBed.inject(AuthStore);
  });

  describe("initial state and computed signals", () => {
    it("should initialize with default state", () => {
      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(store.roles()).toEqual([]);
      expect(store.token()).toBeNull();
      expect(store.isLoading()).toBe(true);
      expect(store.error()).toBeNull();
    });

    it("should compute empty strings when user is null", () => {
      expect(store.username()).toBe("");
      expect(store.userEmail()).toBe("");
      expect(store.firstName()).toBe("");
      expect(store.lastName()).toBe("");
      expect(store.initials()).toBe("");
      expect(store.hasRole()("admin")).toBe(false);
    });
  });

  describe("init()", () => {
    it("should populate user and roles when Keycloak authenticates successfully", async () => {
      const mockProfile = {
        id: "user-123",
        username: "jdoe",
        email: "jdoe@example.com",
        firstName: "John",
        lastName: "Doe",
      };

      mockKeycloakInstance.init.mockResolvedValue(true);
      mockKeycloakInstance.token = "jwt-mock-token";
      mockKeycloakInstance.realmAccess = { roles: ["admin", "user"] };
      mockKeycloakInstance.loadUserProfile.mockResolvedValue(mockProfile);

      const result = await store.init();

      expect(result).toBe(true);
      expect(store.isAuthenticated()).toBe(true);
      expect(store.token()).toBe("jwt-mock-token");
      expect(store.roles()).toEqual(["admin", "user"]);
      expect(store.user()).toEqual(mockProfile);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it("should handle unauthenticated status from Keycloak", async () => {
      mockKeycloakInstance.init.mockResolvedValue(false);

      const result = await store.init();

      expect(result).toBe(false);
      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(store.token()).toBeNull();
      expect(store.isLoading()).toBe(false);
    });

    it("should handle initialization error and update error state", async () => {
      mockKeycloakInstance.init.mockRejectedValue(new Error("Keycloak unreachable"));

      const result = await store.init();

      expect(result).toBe(false);
      expect(store.isAuthenticated()).toBe(false);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBe("Keycloak unreachable");
    });
  });

  describe("login(), register(), and logout()", () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          origin: "https://example.com",
          assign: vi.fn(),
        },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        writable: true,
        value: originalLocation,
      });
    });

    it("should default login redirect to /workspaces when no redirectUri is passed", async () => {
      mockKeycloakInstance.createLoginUrl.mockResolvedValue("https://auth.example.com/login");

      await store.login();

      expect(mockKeycloakInstance.createLoginUrl).toHaveBeenCalledWith({
        redirectUri: "https://example.com/workspaces",
      });
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining("https://auth.example.com/login?theme="),
      );
    });

    it("should default register redirect to /workspaces when no redirectUri is passed", async () => {
      mockKeycloakInstance.createRegisterUrl.mockResolvedValue("https://auth.example.com/register");

      await store.register();

      expect(mockKeycloakInstance.createRegisterUrl).toHaveBeenCalledWith({
        redirectUri: "https://example.com/workspaces",
      });
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining("https://auth.example.com/register?theme="),
      );
    });

    it("should call Keycloak logout and reset state to initialState", async () => {
      mockKeycloakInstance.logout.mockResolvedValue(undefined);

      await store.logout();

      expect(mockKeycloakInstance.logout).toHaveBeenCalled();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
      expect(store.token()).toBeNull();
    });
  });

  describe("getValidToken()", () => {
    beforeEach(async () => {
      mockKeycloakInstance.init.mockResolvedValue(true);
      mockKeycloakInstance.token = "initial-token";
      mockKeycloakInstance.realmAccess = { roles: [] };
      mockKeycloakInstance.loadUserProfile.mockResolvedValue({
        id: "1",
        username: "u",
        email: "u@example.com",
        firstName: "User",
        lastName: "One",
      });
      await store.init();
    });

    it("should return token directly if not expired", async () => {
      mockKeycloakInstance.token = "initial-token";
      mockKeycloakInstance.isTokenExpired.mockReturnValue(false);

      const token = await store.getValidToken();

      expect(token).toBe("initial-token");
      expect(mockKeycloakInstance.updateToken).not.toHaveBeenCalled();
    });

    it("should update and return refreshed token if expiring", async () => {
      mockKeycloakInstance.token = "initial-token";
      mockKeycloakInstance.isTokenExpired.mockReturnValue(true);
      mockKeycloakInstance.updateToken.mockImplementation(async () => {
        mockKeycloakInstance.token = "refreshed-token";
        return true;
      });

      const token = await store.getValidToken();

      expect(mockKeycloakInstance.updateToken).toHaveBeenCalledWith(30);
      expect(token).toBe("refreshed-token");
      expect(store.token()).toBe("refreshed-token");
    });

    it("should clear auth state and return null if token refresh fails", async () => {
      mockKeycloakInstance.token = "initial-token";
      mockKeycloakInstance.isTokenExpired.mockReturnValue(true);
      mockKeycloakInstance.updateToken.mockRejectedValue(new Error("Refresh token expired"));

      const token = await store.getValidToken();

      expect(token).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.token()).toBeNull();
    });
  });
});
