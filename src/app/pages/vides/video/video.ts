
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-video',
  imports: [CommonModule, FormsModule],
  templateUrl: './video.html',
  styleUrl: './video.css',
})
export class Video {
  private api = inject(Api);

  selectedVideo: File | null = null;
  videoKey = '';
  uploadedKey = '';

  isUploading = false;
  isDeleting = false;

  successMessage = '';
  errorMessage = '';

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.successMessage = '';
    this.errorMessage = '';

    if (!file) {
      this.selectedVideo = null;
      return;
    }

    if (!file.type.startsWith('video/')) {
      this.selectedVideo = null;
      input.value = '';
      this.errorMessage = 'Please select a valid video file.';
      return;
    }

    this.selectedVideo = file;
  }

  uploadVideo(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.selectedVideo) {
      this.errorMessage = 'Please select a video before uploading.';
      return;
    }

    this.isUploading = true;

    this.api.uploadVideo(this.selectedVideo).subscribe({
      next: (response: any) => {
        this.isUploading = false;

        const data = response?.data ?? response;
        const key =
          data?.key ??
          data?.video?.key ??
          data?.data?.key ??
          '';

        if (key) {
          this.uploadedKey = key;
          this.videoKey = key;
        }

        this.successMessage = 'Video uploaded successfully.';
        this.selectedVideo = null;

        const input = document.getElementById(
          'videoFile'
        ) as HTMLInputElement | null;

        if (input) {
          input.value = '';
        }
      },
      error: (error: any) => {
        this.isUploading = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to upload the video.';
      },
    });
  }

  deleteVideo(): void {
    this.successMessage = '';
    this.errorMessage = '';

    const key = this.videoKey.trim();

    if (!key) {
      this.errorMessage = 'Enter the video key to delete.';
      return;
    }

    if (!confirm(`Are you sure you want to delete this video?\n\n${key}`)) {
      return;
    }

    this.isDeleting = true;

    this.api.deleteVideo(key).subscribe({
      next: () => {
        this.isDeleting = false;
        this.successMessage = 'Video deleted successfully.';

        if (this.uploadedKey === key) {
          this.uploadedKey = '';
        }

        this.videoKey = '';
      },
      error: (error: any) => {
        this.isDeleting = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to delete the video.';
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  copyVideoKey(): void {
    if (!this.uploadedKey) {
      return;
    }

    navigator.clipboard.writeText(this.uploadedKey).then(
      () => {
        this.successMessage = 'Video key copied to clipboard.';
        this.errorMessage = '';
      },
      () => {
        this.errorMessage = 'Unable to copy the video key.';
      }
    );
  }
}
