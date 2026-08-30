import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ENVIRONMENT } from "../../../../core/tokens/enviroment/environment.token";
import { environment } from "../../../../../environments/environment";
import { ProfileLinkedAccountsTab } from "./profile-linked-accounts-tab";

describe("ProfileLinkedAccountsTab Component", () => {
  let component: ProfileLinkedAccountsTab;
  let fixture: ComponentFixture<ProfileLinkedAccountsTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileLinkedAccountsTab],
      providers: [{ provide: ENVIRONMENT, useValue: environment }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileLinkedAccountsTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component and construct keycloak console URL", () => {
    expect(component).toBeTruthy();
    expect(component.keycloakConsoleUrl()).toContain(
      `${environment.keycloak.url}/realms/${environment.keycloak.realm}/account/#/personal-info/linked-accounts`,
    );
  });

  it("should open Keycloak account console in new window", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    component.openKeycloakConsole();

    expect(openSpy).toHaveBeenCalledWith(
      component.keycloakConsoleUrl(),
      "_blank",
      "noopener,noreferrer",
    );
  });
});
