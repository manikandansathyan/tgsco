import {
  Component,
  EventEmitter,
  Output,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import {
  LucideBell,
  LucideMenu,
  LucideChevronRight,
  LucideLogOut,
} from '@lucide/angular';
import { Auth } from '../../../core/services/auth';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterLink,
    LucideBell,
    LucideMenu,
    LucideChevronRight,
    LucideLogOut,
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit, OnDestroy {
  @Output() menuClick = new EventEmitter<void>();

  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private routerSubscription?: Subscription;

  isLoggingOut = false;
  isProfileMenuOpen = false;

  breadcrumbs: { label: string; url: string }[] = [];

  private readonly routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    catalogue: 'Catalogue',
    groups: 'Groups',
    categories: 'Categories',
    products: 'Products',
    login: 'Login',
    'home': 'Home',
    hero: 'Hero Section',
    story: 'Our Story',
    'government-initiatives': 'Government Initiatives',
    'government-schemes': 'Government Schemes',
    sustainability: 'Sustainability',
    'media-gallery': 'Media Gallery',
    exhibitions: 'Exhibitions',
    'news-and-events': 'News & Events',
    'regional-map': 'Regional Map',
    vision: 'Vision',
  };

  ngOnInit(): void {
    this.updateBreadcrumbs(this.router.url);

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateBreadcrumbs(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private updateBreadcrumbs(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);

    let currentUrl = '';

    this.breadcrumbs = segments.map((segment) => {
      currentUrl += `/${segment}`;

      const decodedSegment = decodeURIComponent(segment);
      const label =
        this.routeLabels[decodedSegment] ??
        this.formatLabel(decodedSegment);

      return {
        label,
        url: currentUrl,
      };
    });

    if (this.breadcrumbs.length === 0) {
      this.breadcrumbs = [
        { label: 'Dashboard', url: '/dashboard' },
      ];
    }
  }

  private formatLabel(segment: string): string {
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

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

