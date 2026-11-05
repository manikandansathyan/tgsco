import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../core/services/api';

interface NotificationItem {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  body?: string;
  type?: string;
  status?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  @Output() close = new EventEmitter<void>();
  @Output() unreadCountChange = new EventEmitter<number>();

  notifications: NotificationItem[] = [];

  loading = false;
  actionLoading = false;
  loadingNotificationId = '';
  errorMessage = '';

  unreadCount = 0;
  page = 1;
  limit = 20;
  totalPages = 1;
  totalNotifications = 0;

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api
      .getNotifications('all', this.page, this.limit)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data;

          this.notifications = Array.isArray(data)
            ? data
            : data?.items ?? [];

          this.totalNotifications =
            data?.total ?? this.notifications.length;

          this.totalPages = data?.pages ?? 1;
        },
        error: (error) => {
          console.error('Failed to load notifications:', error);
          this.errorMessage =
            error?.error?.message || 'Unable to load notifications.';
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

        this.unreadCount =
          typeof data === 'number'
            ? data
            : Number(data?.unreadCount ?? data?.count ?? 0);

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load unread count:', error);
        this.unreadCount = 0;
      },
    });
}

  getNotificationId(notification: NotificationItem): string {
    return notification._id || notification.id || '';
  }

  isUnread(notification: NotificationItem): boolean {
    if (typeof notification.isRead === 'boolean') {
      return !notification.isRead;
    }

    if (typeof notification.read === 'boolean') {
      return !notification.read;
    }

    return notification.status !== 'read';
  }

  getNotificationTitle(notification: NotificationItem): string {
    return notification.title || 'Notification';
  }

  getNotificationMessage(notification: NotificationItem): string {
    return (
      notification.message ||
      notification.body ||
      'You have a new notification.'
    );
  }

  getNotificationDate(notification: NotificationItem): string {
    const date = notification.createdAt;

    if (!date) {
      return '';
    }

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  markAsRead(notification: NotificationItem): void {
    const id = this.getNotificationId(notification);

    if (!id || !this.isUnread(notification)) {
      return;
    }

    this.loadingNotificationId = id;

    this.api
      .markNotificationAsRead(id)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loadingNotificationId = '';
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error('Failed to mark notification as read:', error);
          this.errorMessage =
            error?.error?.message || 'Unable to update notification.';
        },
      });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0 || this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    this.errorMessage = '';

    this.api
      .markAllNotificationsAsRead()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.actionLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error('Failed to mark all notifications as read:', error);
          this.errorMessage =
            error?.error?.message || 'Unable to update notifications.';
        },
      });
  }

  deleteNotification(notification: NotificationItem): void {
    const id = this.getNotificationId(notification);

    if (!id || this.actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this notification?'
    );

    if (!confirmed) {
      return;
    }

    this.loadingNotificationId = id;

    this.api
      .deleteNotification(id)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loadingNotificationId = '';
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error('Failed to delete notification:', error);
          this.errorMessage =
            error?.error?.message || 'Unable to delete notification.';
        },
      });
  }

  deleteAllRead(): void {
    if (this.actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete all read notifications?'
    );

    if (!confirmed) {
      return;
    }

    this.actionLoading = true;
    this.errorMessage = '';

    this.api
      .deleteReadNotifications()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.actionLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error('Failed to delete read notifications:', error);
          this.errorMessage =
            error?.error?.message || 'Unable to delete read notifications.';
        },
      });
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadNotifications();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.close.emit();
  }
}
