
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucidePanelsTopLeft,
  LucideImage,
  LucidePackage,
  LucideSettings,
  LucideChevronDown,
} from '@lucide/angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LucidePanelsTopLeft,
    LucideImage,
    LucidePackage,
    LucideSettings,
    LucideChevronDown,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Output() closeMenu = new EventEmitter<void>();

  isPortfolioOpen = false;
  isHomepageOpen = false;
  isAboutpageOpen = false;
  isSchemepageOpen = false;
  isHeritageOpen = false;
  isNewsAndEventsOpen = false;
  isContactOpen = false;
  isVideoOpen = false;

  togglePortfolio(): void {
    this.isPortfolioOpen = !this.isPortfolioOpen;
  }

  toggleHomepage(): void {
    this.isHomepageOpen = !this.isHomepageOpen;
  }

  toggleAboutPage(): void {
    this.isAboutpageOpen = !this.isAboutpageOpen;
  }

  toggleSchemePage(): void {
    this.isSchemepageOpen = !this.isSchemepageOpen;
  }

  toggleHeritagePage(): void {
    this.isHeritageOpen = !this.isHeritageOpen;
  }

  toggleNewsAndEventsPage(): void {
    this.isNewsAndEventsOpen = !this.isNewsAndEventsOpen;
  }

  toggleContactPage(): void {
    this.isContactOpen = !this.isContactOpen;
  }

  toggleVideoPage(): void {
    this.isVideoOpen = !this.isVideoOpen;
  }
}
