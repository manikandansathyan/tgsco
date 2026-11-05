
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  LucidePackage,
  LucideUsers,
  LucideNewspaper,
  LucideImage,
  LucideArrowUpRight,
  LucideArrowRight,
  LucideFileText,
  LucideCalendarDays,
  LucideClock,
  LucideCheckCircle,
  LucideActivity,
  LucideExternalLink,
  LucideInbox,
  LucideBell,
  LucideRefreshCw,
  LucideCheck
} from '@lucide/angular';

import { Api } from '../../core/services/api';
import { finalize, timeout } from 'rxjs';

type Tone = 'burgundy' | 'green' | 'blue' | 'amber';

interface SummaryCard {
  title: string;
  value: number | null;
  description: string;
  color: Tone;
  route: string;
}

interface ActivityDay {
  day: string;
  blogs: number;
  news: number;
}

interface RecentUpdate {
  title: string;
  category: string;
  date: string;
  status: 'Published' | 'Draft';
  type: 'collection' | 'blog' | 'news' | 'page';
  route: string;
}

interface DashboardNotification {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
  status?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucidePackage,
    LucideUsers,
    LucideNewspaper,
    LucideImage,
    LucideArrowUpRight,
    LucideArrowRight,
    LucideFileText,
    LucideCalendarDays,
    LucideClock,
    LucideCheckCircle,
    LucideActivity,
    LucideExternalLink,
    LucideInbox,
    LucideBell,
    LucideRefreshCw,
    LucideCheck
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly api = inject(Api);
  private readonly cdr = inject(ChangeDetectorRef);

  private static readonly GREETINGS = {
    morning: [
      'Morning',
      'Good morning',
      'Hey there',
      'Hello',
      'Rise and shine',
      'Fresh start',
      'Bright and early',
      'Ready for today',
    ],
    afternoon: [
      'Afternoon',
      'Good afternoon',
      'Hey there',
      'Hello',
      'Welcome back',
      'Hope your day is going well',
      'Keeping at it',
      'Good to see you',
    ],
    evening: [
      'Evening',
      'Good evening',
      'Hey there',
      'Welcome back',
      'Hello',
      'Winding down',
      'Hope you had a good day',
      'Nice to see you',
    ],
    night: [
      'Night owl',
      'Still up',
      'Burning the midnight oil',
      'Hello',
      'Late night session',
      'Working late',
      'The night shift',
      'Quiet hours',
    ],
  } as const;

  readonly summaryCards = signal<SummaryCard[]>([
    {
      title: 'Total Products',
      value: null,
      description: 'Products in catalogue',
      color: 'burgundy',
      route: '/products',
    },
    {
      title: 'Artisans & Makers',
      value: null,
      description: 'Artisans featured',
      color: 'green',
      route: '/makers',
    },
    {
      title: 'Published Content',
      value: null,
      description: 'Blogs and news articles',
      color: 'blue',
      route: '/news',
    },
    {
      title: 'Media Assets',
      value: null,
      description: 'Images and other assets',
      color: 'amber',
      route: '/media',
    },
  ]);

  readonly activityData = signal<ActivityDay[]>(
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
      (day) => ({
        day,
        blogs: 0,
        news: 0,
      })
    )
  );

  readonly recentUpdates = signal<RecentUpdate[]>([]);

  // Notifications
  readonly notifications = signal<DashboardNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly notificationsLoading = signal(false);
  readonly notificationError = signal('');
  readonly markingNotificationId = signal<string | null>(null);

  readonly greeting: string = this.pickGreeting();

  readonly quickActions = [
    {
      title: 'Add Product',
      description: 'Add a product to the catalogue',
      route: '/products',
    },
    {
      title: 'Write a Blog',
      description: 'Create a new blog article',
      route: '/home/blog',
    },
    {
      title: 'Add a Maker',
      description: 'Feature an artisan or weaver',
      route: '/makers',
    },
    {
      title: 'Upload Media',
      description: 'Manage images and assets',
      route: '/media',
    },
  ];

  // Derived chart data
  readonly activityTotal = computed(() =>
    this.activityData().reduce(
      (total, item) => total + item.blogs + item.news,
      0
    )
  );

  readonly chartMax = computed(() => {
    const peak = Math.max(
      ...this.activityData().map((item) =>
        Math.max(item.blogs, item.news)
      ),
      0
    );

    return Math.max(Math.ceil(peak / 5) * 5, 5);
  });

  readonly yTicks = computed(() => {
    const step = this.chartMax() / 5;
    return [5, 4, 3, 2, 1, 0].map(
      (number) => number * step
    );
  });

  ngOnInit(): void {
    this.loadDashboard();
    this.loadNotifications();
  }

  private loadDashboard(): void {
    // Connect dashboard summary APIs here.
  }

  // Notifications

  loadNotifications(): void {
    this.notificationsLoading.set(true);
    this.notificationError.set('');

    this.api
      .getNotifications('all', 1, 5)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.notificationsLoading.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          const items = Array.isArray(data)
            ? data
            : data?.items ?? data?.notifications ?? [];

          this.notifications.set(
            Array.isArray(items) ? items.slice(0, 5) : []
          );

          this.loadUnreadCount();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error(
            'Dashboard notifications error:',
            error
          );

          this.notificationError.set(
            error?.name === 'TimeoutError'
              ? 'Loading notifications timed out.'
              : error?.error?.message ??
              'Unable to load notifications.'
          );

          this.cdr.markForCheck();
        },
      });
  }

  loadUnreadCount(): void {
    this.api
      .getUnreadNotificationCount()
      .pipe(
        timeout(60000),
        finalize(() => this.cdr.markForCheck())
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

          this.unreadCount.set(
            Number.isFinite(count) ? count : 0
          );

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Unread count error:', error);
        },
      });
  }

  getNotificationId(
    item: DashboardNotification
  ): string {
    return String(item._id ?? item.id ?? '');
  }

  isNotificationUnread(
    item: DashboardNotification
  ): boolean {
    if (typeof item.isRead === 'boolean') {
      return !item.isRead;
    }

    if (typeof item.read === 'boolean') {
      return !item.read;
    }

    return item.status?.toLowerCase() !== 'read';
  }

  getNotificationTitle(
    item: DashboardNotification
  ): string {
    return item.title || 'Notification';
  }

  getNotificationMessage(
    item: DashboardNotification
  ): string {
    return (
      item.message ||
      item.body ||
      'No additional details available.'
    );
  }

  getNotificationDate(date?: string): string {
    if (!date) {
      return 'Date unavailable';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  markNotificationAsRead(
    item: DashboardNotification
  ): void {
    const id = this.getNotificationId(item);

    if (
      !id ||
      !this.isNotificationUnread(item) ||
      this.markingNotificationId()
    ) {
      return;
    }

    this.markingNotificationId.set(id);

    this.api
      .markNotificationAsRead(id)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.markingNotificationId.set(null);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.notifications.update((items) =>
            items.map((notification) =>
              this.getNotificationId(notification) === id
                ? {
                  ...notification,
                  isRead: true,
                  read: true,
                  status: 'read',
                }
                : notification
            )
          );

          this.unreadCount.update((count) =>
            Math.max(0, count - 1)
          );

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error(
            'Unable to mark notification as read:',
            error
          );
        },
      });
  }

  // Dashboard helpers

  private getPeriod(
    hour: number
  ): keyof typeof Dashboard.GREETINGS {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private pickGreeting(): string {
    const list =
      Dashboard.GREETINGS[
      this.getPeriod(new Date().getHours())
      ];

    return list[
      Math.floor(Math.random() * list.length)
    ];
  }

  get todayLabel(): string {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  barHeight(value: number): number {
    return (value / this.chartMax()) * 100;
  }
}
