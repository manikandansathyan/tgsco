
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface TechniqueItem {
  name: string;
  description: string;
  mainImageUrl: string;
  borderImageUrl: string;
  mainImageFile: File | null;
  borderImageFile: File | null;
  isExpanded: boolean;
}

@Component({
  selector: 'app-state-techniques',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './state-techniques.html',
  styleUrl: './state-techniques.css',
})
export class StateTechniques implements OnInit {
  title = '';
  backgroundImageAlt = '';
  backgroundImageUrl = '';
  backgroundImageFile: File | null = null;

  items: TechniqueItem[] = [];

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTechniques();
  }

  createEmptyItem(): TechniqueItem {
  return {
    name: '',
    description: '',
    mainImageUrl: '',
    borderImageUrl: '',
    mainImageFile: null,
    borderImageFile: null,
    isExpanded: true,
  };
}

  loadTechniques(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api
      .getTechniquesAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('Techniques API response:', response);

          const data = response?.data ?? response;
          const content = data?.content ?? data;

          this.title = content?.title ?? '';
          this.backgroundImageAlt = content?.backgroundImageAlt ?? '';

          const images: any[] = Array.isArray(data?.images)
            ? data.images
            : [];

          const backgroundImage = images.find(
            (image: any) => image.field === 'backgroundImage'
          );

          this.backgroundImageUrl =
            backgroundImage?.url ??
            content?.backgroundImageUrl ??
            content?.backgroundImage?.url ??
            '';

          const techniqueItems: any[] = Array.isArray(content?.items)
            ? content.items
            : [];

          this.items = techniqueItems.map(
            (item: any, index: number): TechniqueItem => {
              const mainImageField =
                item.mainImageField ?? `items[${index}].mainImage`;

              const borderImageField =
                item.borderImageField ?? `items[${index}].borderImage`;

              const mainImage = images.find(
                (image: any) => image.field === mainImageField
              );

              const borderImage = images.find(
                (image: any) => image.field === borderImageField
              );

             return {
  name: item.name ?? '',
  description: item.description ?? '',
  mainImageUrl:
    mainImage?.url ??
    item.mainImage?.url ??
    item.mainImageUrl ??
    '',
  borderImageUrl:
    borderImage?.url ??
    item.borderImage?.url ??
    item.borderImageUrl ??
    '',
  mainImageFile: null,
  borderImageFile: null,
  isExpanded: false,
};
            }
          );

          this.isExistingContent = !!data?.id;

          console.log('Mapped Techniques:', {
            title: this.title,
            backgroundImageUrl: this.backgroundImageUrl,
            items: this.items,
          });

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Techniques API error:', error);

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'The server is taking too long to respond. Please try again.'
              : error?.error?.message ??
                'Unable to load techniques content.';

          this.cdr.markForCheck();
        },
      });
  }

  onBackgroundImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid background image.';
      input.value = '';
      return;
    }

    if (this.backgroundImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.backgroundImageUrl);
    }

    this.backgroundImageFile = file;
    this.backgroundImageUrl = URL.createObjectURL(file);
    this.errorMessage = '';

    this.cdr.markForCheck();
  }

  onTechniqueImageSelected(
    event: Event,
    index: number,
    imageType: 'main' | 'border'
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    const item = this.items[index];

    if (!item) {
      return;
    }

    if (imageType === 'main') {
      if (item.mainImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.mainImageUrl);
      }

      item.mainImageFile = file;
      item.mainImageUrl = URL.createObjectURL(file);
    } else {
      if (item.borderImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.borderImageUrl);
      }

      item.borderImageFile = file;
      item.borderImageUrl = URL.createObjectURL(file);
    }

    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  addTechnique(): void {
    this.items.push(this.createEmptyItem());
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  removeTechnique(index: number): void {
    const item = this.items[index];

    if (item?.mainImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.mainImageUrl);
    }

    if (item?.borderImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.borderImageUrl);
    }

    this.items.splice(index, 1);
    this.cdr.markForCheck();
  }

  saveTechniques(): void {
    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Add at least one technique.';
      return;
    }

    if (this.items.some((item) => !item.name.trim())) {
      this.errorMessage = 'Please enter a name for every technique.';
      return;
    }

    if (this.items.some((item) => !item.description.trim())) {
      this.errorMessage =
        'Please enter a description for every technique.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const content = {
      title: this.title,
      items: this.items.map((item) => ({
        name: item.name,
        description: item.description,
      })),
      backgroundImageAlt: this.backgroundImageAlt,
    };

    const imageUploads = this.items.map((item, index) => ({
      index,
      mainImage: item.mainImageFile,
      borderImage: item.borderImageFile,
    }));

    const request$ = this.isExistingContent
      ? this.api.updateTechniquesAPI(
          content,
          this.backgroundImageFile,
          imageUploads
        )
      : this.api.addTechniquesAPI(
          content,
          this.backgroundImageFile,
          imageUploads
        );

    request$
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Techniques saved successfully.';
          this.cdr.markForCheck();
          this.loadTechniques();
        },
        error: (error: any) => {
          console.error('Save techniques error:', error);

          this.errorMessage =
            error?.error?.message ??
            'Failed to save techniques content.';

          this.cdr.markForCheck();
        },
      });
  }

  deleteTechniques(): void {
    if (
      !confirm(
        'Are you sure you want to delete the entire State Techniques section?'
      )
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteTechniquesAPI()
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.title = '';
          this.backgroundImageAlt = '';
          this.backgroundImageUrl = '';
          this.backgroundImageFile = null;
          this.items = [];
          this.isExistingContent = false;
          this.successMessage =
            'State Techniques section deleted successfully.';

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Delete techniques error:', error);

          this.errorMessage =
            error?.error?.message ??
            'Failed to delete techniques section.';

          this.cdr.markForCheck();
        },
      });
  }

  toggleTechnique(index: number): void {
  this.items[index].isExpanded = !this.items[index].isExpanded;
}

  trackByIndex(index: number): number {
    return index;
  }
}
