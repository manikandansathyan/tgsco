
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

interface MissionPerson {
  name: string;
  role: string;
  imageAlt: string;
  imageUrl: string | null;
  selectedImage: File | null;
  imagePreview: string | null;
}

@Component({
  selector: 'app-people-guiding-our-mission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './people-guiding-our-mission.html',
  styleUrl: './people-guiding-our-mission.css',
})
export class PeopleGuidingOurMission implements OnInit, OnDestroy {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  title = 'The People Guiding Our Mission';

  people: MissionPerson[] = [];

  decorativeIcon: File | null = null;
  decorativeIconPreview: string | null = null;
  existingDecorativeIconUrl: string | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditing = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.setDefaultPeople();
    this.loadContent();
  }

  ngOnDestroy(): void {
    this.clearAllPreviews();
  }

  private setDefaultPeople(): void {
    this.people = [
      {
        name: 'Vickey Kaushal',
        role: 'Director',
        imageAlt: 'Vickey Kaushal',
        imageUrl: null,
        selectedImage: null,
        imagePreview: null,
      },
      {
        name: 'Zenya Tiara',
        role: 'Director',
        imageAlt: 'Zenya Tiara',
        imageUrl: null,
        selectedImage: null,
        imagePreview: null,
      },
      {
        name: 'Kevina Zey',
        role: 'Director',
        imageAlt: 'Kevina Zey',
        imageUrl: null,
        selectedImage: null,
        imagePreview: null,
      },
      {
        name: 'Namitha Roy',
        role: 'Director',
        imageAlt: 'Namitha Roy',
        imageUrl: null,
        selectedImage: null,
        imagePreview: null,
      },
    ];
  }

  loadContent(): void {
    this.isLoading = true;
    this.message = '';

    this.api
      .getHeritageMissionGuides()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          const result = response?.data ?? response;
          const content = result?.content ?? {};

          if (
            content &&
            typeof content === 'object' &&
            (content.title || Array.isArray(content.people))
          ) {
            this.clearAllPreviews();

            this.decorativeIcon = null;
            this.title = content.title ?? '';

            // The actual image URLs are stored in result.images.
            const uploadedImages = Array.isArray(result?.images)
              ? result.images
              : [];

            // Person information is stored in content.people.
            this.people = Array.isArray(content.people)
              ? content.people.map(
                  (person: any, index: number): MissionPerson => {
                    const imageField =
                      person?.imageField ?? `people[${index}].image`;

                    const uploadedImage = uploadedImages.find(
                      (image: any) => image?.field === imageField
                    );

                    return {
                      name: person?.name ?? '',
                      role: person?.role ?? '',
                      imageAlt:
                        person?.imageAlt ?? person?.name ?? '',
                      imageUrl: uploadedImage?.url ?? null,
                      selectedImage: null,
                      imagePreview: null,
                    };
                  }
                )
              : [];

            // Decorative icon URL is also in result.images.
            const decorativeIconImage = uploadedImages.find(
              (image: any) => image?.field === 'decorativeIcon'
            );

            this.existingDecorativeIconUrl =
              decorativeIconImage?.url ?? null;

            this.isEditing = true;
          } else {
            this.clearAllPreviews();
            this.title = 'The People Guiding Our Mission';
            this.setDefaultPeople();

            this.decorativeIcon = null;
            this.existingDecorativeIconUrl = null;
            this.isEditing = false;
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Unable to load mission guides content.',
            'error'
          );
        },
      });
  }

  addPerson(): void {
    this.people.push({
      name: '',
      role: '',
      imageAlt: '',
      imageUrl: null,
      selectedImage: null,
      imagePreview: null,
    });
  }

  removePerson(index: number): void {
    const person = this.people[index];

    if (person) {
      this.clearPersonPreview(person);
      this.people.splice(index, 1);
    }
  }

  onPersonImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid profile image.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Each image must be 5 MB or less.', 'error');
      input.value = '';
      return;
    }

    const person = this.people[index];

    if (!person) return;

    this.clearPersonPreview(person);

    person.selectedImage = file;
    person.imagePreview = URL.createObjectURL(file);

    this.message = '';
  }

  removePersonImage(index: number): void {
    const person = this.people[index];

    if (!person) return;

    person.selectedImage = null;
    this.clearPersonPreview(person);
  }

  onDecorativeIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage(
        'Please select a valid decorative icon image.',
        'error'
      );
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage(
        'The decorative icon must be 5 MB or less.',
        'error'
      );
      input.value = '';
      return;
    }

    this.clearDecorativeIconPreview();

    this.decorativeIcon = file;
    this.decorativeIconPreview = URL.createObjectURL(file);

    this.message = '';
  }

  removeDecorativeIcon(): void {
    this.decorativeIcon = null;
    this.clearDecorativeIconPreview();
  }

  saveContent(): void {
    if (!this.title.trim()) {
      this.showMessage('Please enter the section title.', 'error');
      return;
    }

    if (this.people.length === 0) {
      this.showMessage('Add at least one person.', 'error');
      return;
    }

    for (let i = 0; i < this.people.length; i++) {
      const person = this.people[i];

      if (!person.name.trim()) {
        this.showMessage(`Enter a name for person ${i + 1}.`, 'error');
        return;
      }

      if (!person.role.trim()) {
        this.showMessage(`Enter a role for ${person.name}.`, 'error');
        return;
      }

      if (!person.imageAlt.trim()) {
        this.showMessage(
          `Enter image alt text for ${person.name}.`,
          'error'
        );
        return;
      }

      if (!person.selectedImage && !person.imageUrl) {
        this.showMessage(
          `Upload a profile image for ${person.name}.`,
          'error'
        );
        return;
      }
    }

    if (!this.decorativeIcon && !this.existingDecorativeIconUrl) {
      this.showMessage(
        'Upload the decorative icon before saving.',
        'error'
      );
      return;
    }

    const content = {
      title: this.title.trim(),

      people: this.people.map((person, index) => ({
        name: person.name.trim(),
        role: person.role.trim(),
        imageField: `people[${index}].image`,
        imageAlt: person.imageAlt.trim(),
      })),

      iconField: 'decorativeIcon',
    };

    const personImages: Record<number, File> = {};

    this.people.forEach((person, index) => {
      if (person.selectedImage) {
        personImages[index] = person.selectedImage;
      }
    });

    this.isSaving = true;
    this.message = '';

    const wasEditing = this.isEditing;

    const request = wasEditing
      ? this.api.updateHeritageMissionGuides(
          content,
          personImages,
          this.decorativeIcon ?? undefined
        )
      : this.api.createHeritageMissionGuides(
          content,
          personImages,
          this.decorativeIcon ?? undefined
        );

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.clearAllPreviews();

          this.decorativeIcon = null;

          this.showMessage(
            response?.message ??
              (wasEditing
                ? 'Mission guides content updated successfully.'
                : 'Mission guides content created successfully.'),
            'success'
          );

          this.loadContent();
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to save mission guides content.',
            'error'
          );
        },
      });
  }

  deleteContent(): void {
    if (
      !window.confirm(
        'Are you sure you want to delete the mission guides content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.message = '';

    this.api
      .deleteHeritageMissionGuides()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isDeleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.clearAllPreviews();

          this.title = 'The People Guiding Our Mission';
          this.setDefaultPeople();

          this.decorativeIcon = null;
          this.existingDecorativeIconUrl = null;
          this.isEditing = false;

          this.showMessage(
            response?.message ??
              'Mission guides content deleted successfully.',
            'success'
          );
        },
        error: (error: any) => {
          this.showMessage(
            error?.error?.message ??
              'Failed to delete mission guides content.',
            'error'
          );
        },
      });
  }

  resetForm(): void {
    this.clearAllPreviews();
    this.decorativeIcon = null;
    this.message = '';

    if (this.isEditing) {
      this.loadContent();
      return;
    }

    this.title = 'The People Guiding Our Mission';
    this.setDefaultPeople();
    this.existingDecorativeIconUrl = null;
  }

  private clearPersonPreview(person?: MissionPerson): void {
    if (person?.imagePreview) {
      URL.revokeObjectURL(person.imagePreview);
      person.imagePreview = null;
    }
  }

  private clearDecorativeIconPreview(): void {
    if (this.decorativeIconPreview) {
      URL.revokeObjectURL(this.decorativeIconPreview);
      this.decorativeIconPreview = null;
    }
  }

  private clearAllPreviews(): void {
    this.people.forEach((person) => this.clearPersonPreview(person));
    this.clearDecorativeIconPreview();
  }

  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message = message;
    this.messageType = type;
  }
}
