
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucidePanelsTopLeft,
  LucideImage,
  LucidePackage,
  LucideUsers,
  LucideNewspaper,
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
    LucideLayoutDashboard,
    LucidePanelsTopLeft,
    LucideSettings,
    LucideChevronDown,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  @Output() closeMenu = new EventEmitter<void>();

  isHomepageOpen = false;
  isAboutpageOpen = false;
  isSchemepageOpen = false;
  isHeritageOpen = false;
  isNewsAndEventsOpen = false;
  isContactOpen = false;
  isVideoOpen = false;

  toggleHomepage(): void {
    this.isHomepageOpen = !this.isHomepageOpen;
  }

  toggleAboutPage(): void {
    this.isAboutpageOpen = !this.isAboutpageOpen;
  }

  toggleSchemePage(): void {
    this.isSchemepageOpen = !this.isSchemepageOpen
  }

  toggleHeritagePage(): void {
    this.isHeritageOpen = !this.isHeritageOpen
  }

  toggleNewsAndEventsPage(): void {
    this.isNewsAndEventsOpen = !this.isNewsAndEventsOpen
  }

  toggleContactPage(): void {
    this.isContactOpen = !this.isContactOpen
  }

  toggleVideoPage(): void {
    this.isVideoOpen = !this.isVideoOpen
  }

}
