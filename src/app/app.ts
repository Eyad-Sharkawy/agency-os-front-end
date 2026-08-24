import { Component } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideMenu } from "@ng-icons/lucide";
import { RouterOutlet } from "@angular/router";
import { Footer } from "./layout/footer/footer";
import { Navbar } from "./layout/navbar/navbar";

@Component({
  selector: "aos-root",
  imports: [RouterOutlet, Navbar, Footer],
  providers: provideIcons({ lucideMenu }),
  templateUrl: "./app.html",
})
export class App {}
