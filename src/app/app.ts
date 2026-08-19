import { Component } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { Icons } from "./shared/components/icons/icons";
import { Button } from "./shared/components/button/button";
import { lucideMenu } from "@ng-icons/lucide";

@Component({
  selector: "aos-root",
  imports: [Icons, Button, Button],
  providers: provideIcons({ lucideMenu }),
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {}
