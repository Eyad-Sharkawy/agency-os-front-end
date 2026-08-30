import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { ProjectsComponent } from "./projects";

describe("ProjectsComponent", () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create projects component and render actions", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Projects");
    expect(compiled.textContent).toContain("New Project");
    expect(compiled.textContent).toContain("Project Engine Ready");
  });
});
