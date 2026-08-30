import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { TasksComponent } from "./tasks";

describe("TasksComponent", () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create tasks component and render actions", () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Tasks");
    expect(compiled.textContent).toContain("Create Task");
    expect(compiled.textContent).toContain("Task Boards Ready");
  });
});
