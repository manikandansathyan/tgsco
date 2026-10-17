import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideBell,
  LucideMenu,
  LucideSearch,
  LucideChevronDown,
  LucideLogOut,
} from '@lucide/angular';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    LucideBell,
    LucideMenu,
    LucideSearch,
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

  logout(): void {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;

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

