import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Button } from "../../shared/components/button/button";
import { Icons } from "../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import {
  lucideArrowRight,
  lucideBuilding2,
  lucideCheckCircle2,
  lucideClock,
  lucideCpu,
  lucideFileText,
  lucideFolderKanban,
  lucideLayers,
  lucideReceiptText,
  lucideShieldCheck,
  lucideSparkles,
  lucideTimer,
  lucideTrendingUp,
  lucideUsers,
  lucideWorkflow,
  lucideZap,
} from "@ng-icons/lucide";
import { simpleGithub } from "@ng-icons/simple-icons";

@Component({
  selector: "aos-how-it-works",
  imports: [Button, RouterLink, Icons],
  providers: [
    provideIcons({
      lucideSparkles,
      lucideArrowRight,
      lucideCheckCircle2,
      lucideUsers,
      lucideFolderKanban,
      lucideTimer,
      lucideReceiptText,
      lucideLayers,
      lucideShieldCheck,
      lucideZap,
      lucideClock,
      lucideTrendingUp,
      lucideBuilding2,
      lucideFileText,
      lucideWorkflow,
      lucideCpu,
      simpleGithub,
    }),
  ],
  templateUrl: "./how-it-works.html",
  styleUrl: "./how-it-works.css",
})
export class HowItWorks {}
