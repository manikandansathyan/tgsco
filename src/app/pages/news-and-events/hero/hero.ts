import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements OnInit, OnDestroy {
  private api = inject(Api);

  title = 'NEWS & EVENTS';
  imageAlt = 'TGSCO handloom exhibition and textiles';

  heroImage: File | null = null;
  imagePreview = '';
  existingImageUrl = '';

  loading = false;
  saving = false;
  deleting = false;
  isEditMode = false;

  message = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadNewsHero();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private parseContent(value: any): any {
    if (typeof value !== 'string') {
      return value ?? {};
    }

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  private extractData(response: any): any {
    let data = response?.data ?? response ?? {};

    if (data?.content !== undefined) {
      const content = this.parseContent(data.content);
      data = { ...data, ...content };
    }

    return data;
  }

  private extractImageUrl(data: any): string {
    const image =
      data?.heroImage ??
      data?.imageUrl ??
      data?.imageURL ??
      data?.image_url ??
      data?.image;

    if (typeof image === 'string') {
      return image;
    }

    return (
      image?.url ??
      image?.imageUrl ??
      image?.secure_url ??
      image?.path ??
      ''
    );
  }

  loadNewsHero(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api.getNewsHero().subscribe({
      next: (response: any) => {
        const data = this.extractData(response);

        this.title = data.title ?? 'NEWS & EVENTS';
        this.imageAlt =
          data.imageAlt ?? 'TGSCO handloom exhibition and textiles';

        this.revokePreview();
        this.heroImage = null;
        this.existingImageUrl = this.extractImageUrl(data);

        this.isEditMode = !!(
          data.title ||
          this.existingImageUrl
        );

        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;

        if (error.status === 404) {
          this.isEditMode = false;
          this.existingImageUrl = '';
          this.message = 'No hero content found. You can create it below.';
          return;
        }

        this.errorMessage =
          error?.error?.message ?? 'Failed to load News & Events hero.';
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must be less than 5 MB.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.revokePreview();

    this.heroImage = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  saveNewsHero(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the hero title.';
      return;
    }

    if (!this.heroImage && !this.existingImageUrl) {
      this.errorMessage = 'Please upload a hero image.';
      return;
    }

    const content = {
      title: this.title.trim(),
      imageField: 'heroImage',
      imageAlt: this.imageAlt.trim() || this.title.trim(),
    };

    this.saving = true;

    const request = this.isEditMode
      ? this.api.updateNewsHero(content, this.heroImage)
      : this.api.createNewsHero(content, this.heroImage);

    request.subscribe({
      next: (response: any) => {
        this.saving = false;
        this.message =
          response?.message ??
          (this.isEditMode
            ? 'News & Events hero updated successfully.'
            : 'News & Events hero created successfully.');

        this.loadNewsHero();
      },
      error: (error: any) => {
        this.saving = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to save News & Events hero.';
      },
    });
  }

  deleteNewsHero(): void {
    if (!confirm('Are you sure you want to delete the News & Events hero?')) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api.deleteNewsHero().subscribe({
      next: () => {
        this.deleting = false;

        this.revokePreview();
        this.title = 'NEWS & EVENTS';
        this.imageAlt = 'TGSCO handloom exhibition and textiles';
        this.heroImage = null;
        this.existingImageUrl = '';
        this.isEditMode = false;

        this.message = 'News & Events hero deleted successfully.';
      },
      error: (error: any) => {
        this.deleting = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to delete News & Events hero.';
      },
    });
  }

  resetForm(): void {
    this.loadNewsHero();
  }

  private revokePreview(): void {
    if (this.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imagePreview = '';
  }
}
