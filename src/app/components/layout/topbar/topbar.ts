
import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';

import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';

import {
  LucideMenu,
  LucideChevronRight,
  LucideLogOut,
  LucideShieldCheck,
  LucideX,
  LucideBell,
} from '@lucide/angular';

import { Auth } from '../../../core/services/auth';
import { Api } from '../../../core/services/api';

import {
  filter,
  Subscription,
  finalize,
  timeout,
} from 'rxjs';

import { Notifications } from '../../notifications/notifications';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TitleCasePipe,
    LucideMenu,
    LucideChevronRight,
    LucideLogOut,
    LucideShieldCheck,
    LucideX,
    Notifications,
    LucideBell
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit, OnDestroy {

  @Output() menuClick = new EventEmitter<void>();

  private readonly auth: Auth;
  private readonly api: Api;
  private readonly cdr: ChangeDetectorRef;
  private readonly router: Router;

  private routerSubscription?: Subscription;

  isLoggingOut = false;
  isProfileMenuOpen = false;
  isProfileModalOpen = false;
  isProfileLoading = false;
  showNotifications = false;

  profileError = '';
  unreadCount = 0;

  profile: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  } | null = null;

  breadcrumbs: { label: string; url: string }[] = [];

  private readonly routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    catalogue: 'Catalogue',
    groups: 'Groups',
    categories: 'Categories',
    products: 'Products',
    login: 'Login',
    home: 'Home',
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
    'profile-security': 'Profile & Security',
    orders: 'Orders',
    'returns-refunds': 'Returns & Refunds',
    inventory: 'Inventory',
    settings: 'Settings',
    contact: 'Contact',
    'contact-hero': 'Contact Hero',
    'contact-inquiries': 'Contact Inquiries',
    faq: 'FAQ',
    map: 'Regional Map',
    message: 'Messages',
    video: 'Video',
    press: 'Press',
    threads: 'Threads',
    'latest-news': 'Latest News',
    schemes: 'Schemes',
    support: 'Support',
    milestones: 'Milestones',
    mission: 'Mission',
    purpose: 'Purpose',
  };

  constructor(
    api: Api,
    auth: Auth,
    cdr: ChangeDetectorRef,
    router: Router
  ) {
    this.api = api;
    this.auth = auth;
    this.cdr = cdr;
    this.router = router;
  }

  ngOnInit(): void {
    this.updateBreadcrumbs(this.router.url);

    this.loadUnreadCount();

    this.routerSubscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.updateBreadcrumbs(event.urlAfterRedirects);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  // Breadcrumbs

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

  // Profile menu

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  openProfileModal(): void {
    this.isProfileMenuOpen = false;
    this.isProfileModalOpen = true;
    this.profile = null;
    this.loadProfile();
  }

  closeProfileModal(): void {
    this.isProfileModalOpen = false;
    this.profileError = '';
  }

  loadProfile(): void {
    this.isProfileLoading = true;
    this.profileError = '';

    this.api
      .getProfile()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isProfileLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          this.profile = {
            id: data?.id ?? '',
            email: data?.email ?? '',
            role: data?.role ?? '',
            isVerified: data?.isVerified ?? false,
            createdAt: data?.createdAt ?? '',
            updatedAt: data?.updatedAt ?? '',
          };

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Profile API error:', error);

          this.profileError =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ??
                'Unable to load profile details. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  getInitials(email: string): string {
    if (!email) {
      return 'A';
    }

    return email.charAt(0).toUpperCase();
  }

  formatDate(date: string): string {
    if (!date) {
      return 'Not available';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Not available';
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Notifications

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;

    if (this.showNotifications) {
      this.loadUnreadCount();
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  loadUnreadCount(): void {
    this.api
      .getUnreadNotificationCount()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          const count =
            typeof data === 'number'
              ? data
              : Number(
                  data?.unreadCount ??
                  data?.count ??
                  data?.total ??
                  0
                );

          this.unreadCount = Number.isFinite(count) ? count : 0;

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Unread notification count error:', error);
          this.unreadCount = 0;
          this.cdr.markForCheck();
        },
      });
  }

  onUnreadCountChange(count: number): void {
    this.unreadCount = count;
    this.cdr.markForCheck();
  }

  // Logout

  logout(): void {
    if (this.isLoggingOut) {
      return;
    }

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
        this.cdr.markForCheck();
      },
    });
  }
}
