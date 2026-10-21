
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBell,
  LucideMenu,
  LucideChevronDown,
  LucideLogOut,
} from '@lucide/angular';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterLink,
    LucideBell,
    LucideMenu,
    LucideChevronDown,
    LucideLogOut,
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  @Output() menuClick = new EventEmitter<void>();

  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  isLoggingOut = false;
  isProfileMenuOpen = false;

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout(): void {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;
    this.isProfileMenuOpen = false;

    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
      complete: () => {
        this.isLoggingOut = false;
      },
    });
  }
}

