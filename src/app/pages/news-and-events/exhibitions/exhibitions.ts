import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';

interface ExhibitionItem {
  id: string;
  slug: string;
  label: string;
  imageAlt: string;
  imageFile: File | null;
  imagePreview: string;
  existingImageUrl: string;
}

@Component({
  selector: 'app-exhibitions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exhibitions.html',
  styleUrl: './exhibitions.css',
})
export class Exhibitions implements OnInit, OnDestroy {
  private api = inject(Api);

  sectionTitle = 'Exhibitions';
  items: ExhibitionItem[] = [];

  loading = false;
  saving = false;
  deleting = false;
  isEditMode = false;

  message = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadExhibitions();
  }

  ngOnDestroy(): void {
    this.clearImagePreviews();
  }

  private parseContent(value: any): any {
    if (typeof value !== 'string') return value ?? {};

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

  private extractImageUrl(item: any): string {
    const image =
      item?.imageUrl ??
      item?.imageURL ??
      item?.image_url ??
      item?.image;

    if (typeof image === 'string') return image;

    return (
      image?.url ??
      image?.imageUrl ??
      image?.secure_url ??
      image?.path ??
      ''
    );
  }

  private createEmptyItem(index: number): ExhibitionItem {
    return {
      id: `exhibition-${index + 1}`,
      slug: `exhibition-${index + 1}`,
      label: '',
      imageAlt: '',
      imageFile: null,
      imagePreview: '',
      existingImageUrl: '',
    };
  }

  loadExhibitions(): void {
    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.api.getExhibitions().subscribe({
      next: (response: any) => {
        const data = this.extractData(response);

        this.clearImagePreviews();
        this.sectionTitle = data.title ?? 'Exhibitions';

        this.items = Array.isArray(data.items)
          ? data.items.map((item: any, index: number) => {
              const defaultId = `exhibition-${index + 1}`;

              return {
                id: item.id ?? defaultId,
                slug: item.slug ?? item.id ?? defaultId,
                label: item.label ?? '',
                imageAlt: item.imageAlt ?? '',
                imageFile: null,
                imagePreview: '',
                existingImageUrl: this.extractImageUrl(item),
              };
            })
          : [];

        this.isEditMode = !!data.title || this.items.length > 0;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;

        if (error.status === 404) {
          this.isEditMode = false;
          this.message = 'No exhibitions found. You can create the section below.';
          return;
        }

        this.errorMessage =
          error?.error?.message ?? 'Failed to load exhibitions.';
      },
    });
  }

  addItem(): void {
    this.items.push(this.createEmptyItem(this.items.length));
  }

  removeItem(index: number): void {
    this.revokeUrl(this.items[index]?.imagePreview);
    this.items.splice(index, 1);
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Each image must be less than 5 MB.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    const item = this.items[index];

    this.revokeUrl(item.imagePreview);
    item.imageFile = file;
    item.imagePreview = URL.createObjectURL(file);
  }

  private makeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  saveExhibitions(): void {
    this.message = '';
    this.errorMessage = '';

    if (!this.sectionTitle.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Please add at least one exhibition.';
      return;
    }

    for (let index = 0; index < this.items.length; index++) {
      const item = this.items[index];

      if (!item.label.trim()) {
        this.errorMessage = `Please enter a label for exhibition ${index + 1}.`;
        return;
      }

      if (!item.imageFile && !item.existingImageUrl) {
        this.errorMessage = `Please upload an image for exhibition ${index + 1}.`;
        return;
      }
    }

    const content = {
      title: this.sectionTitle.trim(),
      items: this.items.map((item, index) => ({
        id: item.id.trim() || `exhibition-${index + 1}`,
        slug: item.slug.trim() || this.makeSlug(item.label),
        label: item.label.trim(),
        imageField: `items[${index}].image`,
        imageAlt: item.imageAlt.trim() || item.label.trim(),
      })),
    };

    const itemImages: Record<number, File> = {};

    this.items.forEach((item, index) => {
      if (item.imageFile) {
        itemImages[index] = item.imageFile;
      }
    });

    this.saving = true;

    const request = this.isEditMode
      ? this.api.updateExhibitions(content, itemImages)
      : this.api.createExhibitions(content, itemImages);

    request.subscribe({
      next: (response: any) => {
        this.saving = false;
        this.message =
          response?.message ??
          (this.isEditMode
            ? 'Exhibitions updated successfully.'
            : 'Exhibitions created successfully.');

        this.loadExhibitions();
      },
      error: (error: any) => {
        this.saving = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to save exhibitions.';
      },
    });
  }

  deleteExhibitions(): void {
    if (!confirm('Are you sure you want to delete the entire Exhibitions section?')) {
      return;
    }

    this.deleting = true;
    this.message = '';
    this.errorMessage = '';

    this.api.deleteExhibitions().subscribe({
      next: () => {
        this.deleting = false;
        this.clearImagePreviews();
        this.sectionTitle = 'Exhibitions';
        this.items = [];
        this.isEditMode = false;
        this.message = 'Exhibitions section deleted successfully.';
      },
      error: (error: any) => {
        this.deleting = false;
        this.errorMessage =
          error?.error?.message ?? 'Failed to delete exhibitions.';
      },
    });
  }

  resetForm(): void {
    this.loadExhibitions();
  }

  private clearImagePreviews(): void {
    this.items.forEach((item) => this.revokeUrl(item.imagePreview));
  }

  private revokeUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}
