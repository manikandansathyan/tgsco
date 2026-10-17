import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

    this.api.getHeritageMissionGuides().subscribe({
      next: (response: any) => {
        const result = response?.data ?? response;
        const content = result?.content ?? result;

        if (
          content &&
          typeof content === 'object' &&
          (content.title || Array.isArray(content.people))
        ) {
          this.clearAllPreviews();

          this.title = content.title ?? '';

          if (Array.isArray(content.people)) {
            this.people = content.people.map(
              (person: any, index: number): MissionPerson => ({
                name: person?.name ?? '',
                role: person?.role ?? '',
                imageAlt: person?.imageAlt ?? person?.name ?? '',
                imageUrl: this.extractPersonImageUrl(person, result, index),
                selectedImage: null,
                imagePreview: null,
              })
            );
          }

          this.existingDecorativeIconUrl =
            this.extractDecorativeIconUrl(content, result);

          this.isEditing = true;
        } else {
          this.isEditing = false;
        }

        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.showMessage(
          error?.error?.message ?? 'Unable to load mission guides content.',
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
    this.clearPersonPreview(this.people[index]);
    this.people.splice(index, 1);
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
    this.clearPersonPreview(person);
    person.selectedImage = file;
    person.imagePreview = URL.createObjectURL(file);
    this.message = '';
  }

  removePersonImage(index: number): void {
    const person = this.people[index];
    this.clearPersonPreview(person);
    person.selectedImage = null;
  }

  onDecorativeIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid decorative icon image.', 'error');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('The decorative icon must be 5 MB or less.', 'error');
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
        this.showMessage(`Enter image alt text for ${person.name}.`, 'error');
        return;
      }

      if (!this.isEditing && !person.selectedImage && !person.imageUrl) {
        this.showMessage(
          `Upload a profile image for ${person.name} before creating the content.`,
          'error'
        );
        return;
      }
    }

    if (!this.isEditing && !this.decorativeIcon) {
      this.showMessage(
        'Upload the decorative icon before creating the content.',
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

    request.subscribe({
      next: (response: any) => {
        this.isSaving = false;
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
        this.isSaving = false;
        this.showMessage(
          error?.error?.message ?? 'Failed to save mission guides content.',
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

    this.api.deleteHeritageMissionGuides().subscribe({
      next: (response: any) => {
        this.isDeleting = false;
        this.clearAllPreviews();
        this.title = 'The People Guiding Our Mission';
        this.setDefaultPeople();
        this.existingDecorativeIconUrl = null;
        this.decorativeIcon = null;
        this.isEditing = false;

        this.showMessage(
          response?.message ?? 'Mission guides content deleted successfully.',
          'success'
        );
      },
      error: (error: any) => {
        this.isDeleting = false;
        this.showMessage(
          error?.error?.message ?? 'Failed to delete mission guides content.',
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

  private extractPersonImageUrl(
    person: any,
    result: any,
    index: number
  ): string | null {
    const image = person?.image;

    return (
      person?.imageUrl ??
      person?.imageURL ??
      (typeof image === 'string' ? image : image?.url) ??
      result?.people?.[index]?.imageUrl ??
      null
    );
  }

  private extractDecorativeIconUrl(content: any, result: any): string | null {
    const icon = content?.decorativeIcon;

    return (
      content?.decorativeIconUrl ??
      content?.iconUrl ??
      (typeof icon === 'string' ? icon : icon?.url) ??
      result?.decorativeIconUrl ??
      null
    );
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
