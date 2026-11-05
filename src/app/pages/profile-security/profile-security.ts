import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-profile-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-security.html',
  styleUrl: './profile-security.css',
})
export class ProfileSecurity implements OnInit {
  isLoading = false;
  isSavingProfile = false;
  isChangingPassword = false;

  profileError = '';
  profileSuccess = '';
  passwordError = '';
  passwordSuccess = '';

  profile = {
    id: '',
    name: '',
    email: '',
    mobile: '',
    role: '',
    isVerified: false,
    createdAt: '',
    updatedAt: '',
  };

  profileForm = {
    name: '',
    email: '',
    mobile: '',
    currentPassword: '',
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileError = '';

    this.api
      .getProfile()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;

          this.profile = {
            id: data?.id ?? '',
            name: data?.name ?? '',
            email: data?.email ?? '',
            mobile: data?.mobile ?? '',
            role: data?.role ?? '',
            isVerified: data?.isVerified ?? false,
            createdAt: data?.createdAt ?? '',
            updatedAt: data?.updatedAt ?? '',
          };

          this.profileForm.name = this.profile.name;
          this.profileForm.email = this.profile.email;
          this.profileForm.mobile = this.profile.mobile;

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

  updateProfile(): void {
    if (
      !this.profileForm.name.trim() ||
      !this.profileForm.email.trim() ||
      !this.profileForm.currentPassword
    ) {
      this.profileError =
        'Please enter your name, email, and current password.';
      return;
    }

    this.isSavingProfile = true;
    this.profileError = '';
    this.profileSuccess = '';

    const data = {
      currentPassword: this.profileForm.currentPassword,
      name: this.profileForm.name.trim(),
      email: this.profileForm.email.trim(),
      mobile: this.profileForm.mobile.trim(),
    };

    this.api
      .updateProfile(data)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSavingProfile = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.profileSuccess =
            response?.message ?? 'Profile updated successfully.';

          this.profileForm.currentPassword = '';
          this.loadProfile();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Update profile error:', error);

          this.profileError =
            error?.error?.message ?? 'Failed to update profile.';

          this.cdr.markForCheck();
        },
      });
  }

  changePassword(): void {
    if (
      !this.passwordForm.currentPassword ||
      !this.passwordForm.newPassword ||
      !this.passwordForm.confirmNewPassword
    ) {
      this.passwordError = 'Please complete all password fields.';
      return;
    }

    if (this.passwordForm.newPassword.length < 8) {
      this.passwordError =
        'Your new password must contain at least 8 characters.';
      return;
    }

    if (
      this.passwordForm.newPassword !==
      this.passwordForm.confirmNewPassword
    ) {
      this.passwordError = 'The new passwords do not match.';
      return;
    }

    if (
      this.passwordForm.currentPassword ===
      this.passwordForm.newPassword
    ) {
      this.passwordError =
        'Your new password must be different from your current password.';
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const data = {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword,
      confirmNewPassword: this.passwordForm.confirmNewPassword,
    };

    this.api
      .changeProfilePassword(data)
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isChangingPassword = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.passwordSuccess =
            response?.message ?? 'Password changed successfully.';

          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
          };

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Change password error:', error);

          this.passwordError =
            error?.error?.message ?? 'Failed to change password.';

          this.cdr.markForCheck();
        },
      });
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

  getInitials(email: string): string {
    return email ? email.charAt(0).toUpperCase() : 'A';
  }
}