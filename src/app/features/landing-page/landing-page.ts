import { Component } from "@angular/core";
import { Button } from "../../shared/components/button/button";
import { RouterLink } from "@angular/router";
import { Icons } from "../../shared/components/icons/icons";
import { provideIcons } from "@ng-icons/core";
import { FeatureCard } from "./feature-card/feature-card";

import {
  lucideArrowRight,
  lucideBarChart3,
  lucideCalendarRange,
  lucideCheckCircle2,
  lucideCircleDot,
  lucideClipboardList,
  lucideClock,
  lucideFolderKanban,
  lucideKanbanSquare,
  lucideLayers,
  lucidePlay,
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
  selector: "aos-landing-page",
  imports: [Button, RouterLink, Icons, FeatureCard],
  providers: [
    provideIcons({
      lucideUsers,
      lucideClipboardList,
      lucideKanbanSquare,
      lucideCalendarRange,
      lucideTimer,
      lucideReceiptText,
      lucideWorkflow,
      lucideTrendingUp,
      lucideBarChart3,
      lucideSparkles,
      lucideArrowRight,
      lucideCheckCircle2,
      lucideShieldCheck,
      lucideZap,
      lucideLayers,
      lucideClock,
      lucideFolderKanban,
      lucideCircleDot,
      lucidePlay,
      simpleGithub,
    }),
  ],
  templateUrl: "./landing-page.html",
})
export class LandingPage {}
