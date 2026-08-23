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
  return {
    default: class MockKeycloak {
      init = mockKeycloakInstance.init;
      loadUserProfile = mockKeycloakInstance.loadUserProfile;
      login = mockKeycloakInstance.login;
      register = mockKeycloakInstance.register;
      logout = mockKeycloakInstance.logout;
      createLoginUrl = mockKeycloakInstance.createLoginUrl;
      createRegisterUrl = mockKeycloakInstance.createRegisterUrl;
      isTokenExpired = mockKeycloakInstance.isTokenExpired;
      updateToken = mockKeycloakInstance.updateToken;
      get token() {
        return mockKeycloakInstance.token;
      }
      set token(val) {
        mockKeycloakInstance.token = val;
      }
      get realmAccess() {
        return mockKeycloakInstance.realmAccess;
      }
      set realmAccess(val) {
        mockKeycloakInstance.realmAccess = val;
      }
    },
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

      // Test computed properties with loaded user
      expect(store.username()).toBe("jdoe");
      expect(store.userEmail()).toBe("jdoe@example.com");
      expect(store.firstName()).toBe("John");
      expect(store.lastName()).toBe("Doe");
      expect(store.initials()).toBe("JD");
      expect(store.hasRole()("admin")).toBe(true);
      expect(store.hasRole()("superadmin")).toBe(false);
    });

    it("should handle unauthenticated status from Keycloak", async () => {
      mockKeycloakInstance.init.mockResolvedValue(false);

      const result = await store.init();

      expect(result).toBe(false);
      expect(store.isAuthenticated()).toBe(false);
      expect(store.isLoading()).toBe(false);
      expect(store.user()).toBeNull();
    });

    it("should handle initialization error and update error state", async () => {
      mockKeycloakInstance.init.mockRejectedValue(new Error("Keycloak server down"));

      const result = await store.init();

      expect(result).toBe(false);
      expect(store.isAuthenticated()).toBe(false);
      expect(store.isLoading()).toBe(false);
      expect(store.error()).toBe("Keycloak server down");
    });
  });

  describe("login(), register(), and logout()", () => {
    let assignSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      assignSpy = vi.fn();
      Object.defineProperty(window, "location", {
        writable: true,
        value: {
          ...window.location,
          origin: "http://localhost:4200",
          assign: assignSpy,
        },
      });
    });

    it("should call Keycloak createLoginUrl and redirect with theme", async () => {
      mockKeycloakInstance.createLoginUrl.mockResolvedValue("https://auth.example.com/login");

      await store.login("https://example.com/callback");

      expect(mockKeycloakInstance.createLoginUrl).toHaveBeenCalledWith({
        redirectUri: "https://example.com/callback",
      });
      expect(assignSpy).toHaveBeenCalledWith(
        expect.stringContaining("https://auth.example.com/login?theme="),
      );
    });

    it("should call Keycloak createRegisterUrl and redirect with theme", async () => {
      mockKeycloakInstance.createRegisterUrl.mockResolvedValue("https://auth.example.com/register");

      await store.register("https://example.com/register");

      expect(mockKeycloakInstance.createRegisterUrl).toHaveBeenCalledWith({
        redirectUri: "https://example.com/register",
      });
      expect(assignSpy).toHaveBeenCalledWith(
        expect.stringContaining("https://auth.example.com/register?theme="),
      );
    });

    it("should call Keycloak logout and reset state to initialState", async () => {
      mockKeycloakInstance.logout.mockResolvedValue(undefined);

      await store.logout();

      expect(mockKeycloakInstance.logout).toHaveBeenCalled();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.user()).toBeNull();
    });
  });

  describe("getValidToken()", () => {
    it("should return token directly if not expired", async () => {
      mockKeycloakInstance.token = "valid-token";
      mockKeycloakInstance.isTokenExpired.mockReturnValue(false);

      const token = await store.getValidToken();

      expect(token).toBe("valid-token");
      expect(mockKeycloakInstance.updateToken).not.toHaveBeenCalled();
    });

    it("should update and return refreshed token if expiring", async () => {
      mockKeycloakInstance.token = "old-token";
      mockKeycloakInstance.isTokenExpired.mockReturnValue(true);
      mockKeycloakInstance.updateToken.mockImplementation(async () => {
        mockKeycloakInstance.token = "refreshed-token";
      });

      const token = await store.getValidToken();

      expect(mockKeycloakInstance.updateToken).toHaveBeenCalledWith(30);
      expect(token).toBe("refreshed-token");
      expect(store.token()).toBe("refreshed-token");
    });

    it("should reset authentication if token update fails", async () => {
      mockKeycloakInstance.isTokenExpired.mockReturnValue(true);
      mockKeycloakInstance.updateToken.mockRejectedValue(new Error("Refresh failed"));

      const token = await store.getValidToken();

      expect(token).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.token()).toBeNull();
    });
  });
});
