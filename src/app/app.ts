import { Component } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { Icons } from "./shared/components/icons/icons";
import { Button } from "./shared/components/button/button";
import { lucideMenu } from "@ng-icons/lucide";
import { Navbar } from "./layout/navbar/navbar";

@Component({
  selector: "aos-root",
  imports: [Icons, Button, Button, Navbar],
  providers: provideIcons({ lucideMenu }),
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {}
