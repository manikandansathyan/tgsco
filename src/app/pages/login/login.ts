import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { LucideEye, LucideEyeClosed } from '@lucide/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideEye,
    LucideEyeClosed,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  onLogin(): void {
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login({
      email: this.email.trim(),
      password: this.password,
    }).subscribe({
      next: (response) => {
        console.log('Login response:', response);

        const token: unknown = (response as {
          data?: { accessToken?: unknown };
        } | null)?.data?.accessToken;

        if (typeof token !== 'string' || !token.trim()) {
          this.errorMessage = 'Login successful, but access token was not received.';
          this.isLoading = false;
          return;
        }

        sessionStorage.setItem('token', token);

        this.router.navigate(['/dashboard'])
          .then((success) => {
            if (!success) {
              this.errorMessage = 'Unable to navigate to dashboard.';
            }
          })
          .catch((error) => {
            console.error('Navigation error:', error);
            this.errorMessage = 'Navigation failed. Please try again.';
          })
          .finally(() => {
            this.isLoading = false;
          });
      },

      error: (error) => {
        console.error('Login API error:', error);

        this.errorMessage =
          error?.error?.message || 'Login failed. Please try again.';

        this.isLoading = false;
      },
    });
  }
}

