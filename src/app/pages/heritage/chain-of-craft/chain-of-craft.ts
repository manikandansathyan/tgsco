
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface CraftRole {
  eyebrow: string;
  title: string;
  description: string;
  color: string;
  imageField: string;
  imageAlt: string;
  imageUrl: string | null;
  imagePreview: string | null;
}

@Component({
  selector: 'app-chain-of-craft',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chain-of-craft.html',
  styleUrl: './chain-of-craft.css',
})
export class ChainOfCraft implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  eyebrow = 'A Chain of Craft';
  title =
    'Every TGSCO product passes through many hands before it reaches yours';

  roles: CraftRole[] = [];
  selectedImages: Record<number, File> = {};

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.setDefaultRoles();
    this.loadChainOfCraft();
  }

  ngOnDestroy(): void {
    this.clearAllPreviews();
  }

  private setDefaultRoles(): void {
    const defaults = [
      {
        eyebrow: 'Growing the Foundation',
        title: 'Farmers',
        description: '',
        color: '#C95D52',
        imageAlt: 'Farmers harvesting cotton',
      },
      {
        eyebrow: 'Preparing the Yarn',
        title: 'Yarn Suppliers',
        description: '',
        color: '#E3A900',
        imageAlt: 'Natural coloured yarn',
      },
      {
        eyebrow: 'Bringing Colour to Life',
        title: 'Dyers',
        description: '',
        color: '#171717',
        imageAlt: 'Dyeing fabric by hand',
      },
      {
        eyebrow: 'Creating Timeless Patterns',
        title: 'Designers',
        description: '',
        color: '#32C957',
        imageAlt: 'Designer creating a handloom pattern',
      },
      {
        eyebrow: 'Weaving Every Thread',
        title: 'Weavers',
        description: '',
        color: '#B24BDD',
        imageAlt: 'Weaver working at a handloom',
      },
      {
        eyebrow: 'Empowering Artisan Communities',
        title: 'Cooperatives',
        description: '',
        color: '#A88C65',
        imageAlt: 'Handloom fabric rolls in a cooperative',
      },
      {
        eyebrow: 'Keeping the Tradition Alive',
        title: 'You (Customer)',
        description: '',
        color: '#35A9DE',
        imageAlt: 'Customer choosing handloom textiles',
      },
    ];

    this.roles = defaults.map((role, index) => ({
      ...role,
      imageField: `roles[${index}].image`,
      imageUrl: null,
      imagePreview: null,
    }));
  }

  loadChainOfCraft(): void {
    this.isLoading = true;
    this.message = '';

    this.api
      .getChainOfCraft()
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
          const content = data?.content ?? {};

          if (
            content &&
            typeof content === 'object' &&
            Array.isArray(content.roles)
          ) {
            this.eyebrow = content.eyebrow ?? '';
            this.title = content.title ?? '';

            const images = Array.isArray(data?.images)
              ? data.images
              : [];

            this.clearAllPreviews();

            this.roles = content.roles.map(
              (role: any, index: number): CraftRole => {
                const imageField = `roles[${index}].image`;

                const matchedImage = images.find(
                  (image: any) => image.field === imageField
                );

                return {
                  eyebrow: role.eyebrow ?? '',
                  title: role.title ?? '',
                  description: role.description ?? '',
                  color: role.color ?? '#C51F32',
                  imageField,
                  imageAlt: role.imageAlt ?? '',
                  imageUrl: matchedImage?.url ?? null,
                  imagePreview: null,
                };
              }
            );

            this.isEditing = true;
          } else {
            this.isEditing = false;
            this.eyebrow = 'A Chain of Craft';
            this.title =
              'Every TGSCO product passes through many hands before it reaches yours';
            this.setDefaultRoles();
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Unable to load Chain of Craft content.',
            'error'
          );
        },
      });
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Each image must be 5 MB or less.', 'error');
      input.value = '';
      return;
    }

    this.clearRolePreview(index);

    this.selectedImages[index] = file;
    this.roles[index].imagePreview = URL.createObjectURL(file);

    this.message = '';
    this.cdr.markForCheck();
  }

  removeSelectedImage(index: number): void {
    delete this.selectedImages[index];
    this.clearRolePreview(index);

    this.cdr.markForCheck();
  }

  saveChainOfCraft(): void {
    if (!this.eyebrow.trim() || !this.title.trim()) {
      this.showMessage('Please enter the eyebrow and title.', 'error');
      return;
    }

    if (this.roles.length !== 7) {
      this.showMessage(
        'Chain of Craft must contain all seven roles.',
        'error'
      );
      return;
    }

    for (let index = 0; index < this.roles.length; index++) {
      const role = this.roles[index];

      if (
        !role.eyebrow.trim() ||
        !role.title.trim() ||
        !role.description.trim() ||
        !role.color.trim() ||
        !role.imageAlt.trim()
      ) {
        this.showMessage(
          `Please complete all required fields for ${role.title || `role ${index + 1}`}.`,
          'error'
        );
        return;
      }

      if (!this.isEditing && !this.selectedImages[index]) {
        this.showMessage(
          `Please upload an image for ${role.title}.`,
          'error'
        );
        return;
      }
    }

    const content = {
      eyebrow: this.eyebrow.trim(),
      title: this.title.trim(),
      roles: this.roles.map((role, index) => ({
        eyebrow: role.eyebrow.trim(),
        title: role.title.trim(),
        description: role.description.trim(),
        color: role.color,
        imageField: `roles[${index}].image`,
        imageAlt: role.imageAlt.trim(),
      })),
    };

    this.isSaving = true;
    this.message = '';

    const request = this.isEditing
      ? this.api.updateChainOfCraft(content, this.selectedImages)
      : this.api.createChainOfCraft(content, this.selectedImages);

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const wasEditing = this.isEditing;

          this.clearAllPreviews();
          this.selectedImages = {};

          this.showMessage(
            response?.message ??
              (wasEditing
                ? 'Chain of Craft updated successfully.'
                : 'Chain of Craft created successfully.'),
            'success'
          );

          this.loadChainOfCraft();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to save Chain of Craft content.',
            'error'
          );
        },
      });
  }

  deleteChainOfCraft(): void {
    if (
      !window.confirm(
        'Are you sure you want to delete all Chain of Craft content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.message = '';

    this.api
      .deleteChainOfCraft()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.clearAllPreviews();
          this.selectedImages = {};

          this.eyebrow = 'A Chain of Craft';
          this.title =
            'Every TGSCO product passes through many hands before it reaches yours';

          this.isEditing = false;
          this.setDefaultRoles();

          this.showMessage(
            response?.message ??
              'Chain of Craft content deleted successfully.',
            'success'
          );
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to delete Chain of Craft content.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.clearAllPreviews();
    this.selectedImages = {};
    this.message = '';

    if (this.isEditing) {
      this.loadChainOfCraft();
    } else {
      this.eyebrow = 'A Chain of Craft';
      this.title =
        'Every TGSCO product passes through many hands before it reaches yours';
      this.setDefaultRoles();
    }

    this.cdr.markForCheck();
  }

  private clearRolePreview(index: number): void {
    const preview = this.roles[index]?.imagePreview;

    if (preview) {
      URL.revokeObjectURL(preview);
      this.roles[index].imagePreview = null;
    }
  }

  private clearAllPreviews(): void {
    this.roles.forEach((_, index) => {
      this.clearRolePreview(index);
    });
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message = message;
    this.messageType = type;
    this.cdr.markForCheck();
  }
}
