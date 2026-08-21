import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: "aos-dashboard-dashboard-shell",
  imports: [RouterOutlet, Sidebar],
  templateUrl: "./dashboard-shell.html",
  styleUrl: "./dashboard-shell.css",
})
export class DashboardShell {}
