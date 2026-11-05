
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface MissionCard {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-mission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mission.html',
  styleUrl: './mission.css'
})
export class Mission implements OnInit {
  title = 'Our Mission';

  cards: MissionCard[] = [
    {
      icon: 'shield',
      text: 'To safeguard the livelihoods of Telangana’s handloom weavers'
    },
    {
      icon: 'megaphone',
      text: 'To preserve and promote traditional weaving techniques.'
    },
    {
      icon: 'fairness',
      text: 'To ensure fair wages and dignified working conditions for artisans'
    },
    {
      icon: 'accessibility',
      text: 'To make authentic handloom products accessible to a wider audience.'
    },
    {
      icon: 'sustainability',
      text: 'To champion sustainable, slow-fashion practices rooted in Telangana’s textile heritage.'
    }
  ];

  missionImage: File | null = null;
  missionSecondaryImage: File | null = null;

  missionImageUrl = '';
  missionSecondaryImageUrl = '';

  missionImagePreview = '';
  missionSecondaryImagePreview = '';

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMission();
  }

loadMission(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.api.getMissionAPI()
    .pipe(
      timeout(60000),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    )
    .subscribe({
      next: (response: any) => {
        const responseData = response?.data ?? response;
        const data = responseData?.content ?? responseData;

        if (!data || typeof data !== 'object') {
          this.isExistingContent = false;
          return;
        }

        this.isExistingContent = !!responseData?.id;

        // Load title
        this.title = data.title ?? 'Our Mission';

        // Load mission cards
        if (Array.isArray(data.cards)) {
          this.cards = data.cards.map((card: any) => ({
            icon: card?.icon ?? '',
            text: card?.text ?? ''
          }));
        }

        // Find images using their field names
        const images = Array.isArray(responseData?.images)
          ? responseData.images
          : [];

        const primaryImage = images.find(
          (image: any) => image.field === 'missionImage'
        );

        const secondaryImage = images.find(
          (image: any) => image.field === 'missionSecondaryImage'
        );

        // Set image URLs
        this.missionImageUrl =
          primaryImage?.url ??
          this.getImageUrl(
            data.missionImageUrl ??
            data.missionImage
          );

        this.missionSecondaryImageUrl =
          secondaryImage?.url ??
          this.getImageUrl(
            data.missionSecondaryImageUrl ??
            data.missionSecondaryImage
          );

        // Set image previews
        this.missionImagePreview = this.missionImageUrl;
        this.missionSecondaryImagePreview =
          this.missionSecondaryImageUrl;

        this.cdr.markForCheck();
      },

      error: (error: any) => {
        console.error('Failed to load mission content:', error);

        if (error?.status === 404) {
          this.isExistingContent = false;
        } else {
          this.errorMessage =
            error?.error?.message ||
            'Unable to load mission content.';
        }

        this.cdr.markForCheck();
      }
    });
}

  private getImageUrl(value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof value.url === 'string') {
      return value.url;
    }

    if (value && typeof value.secure_url === 'string') {
      return value.secure_url;
    }

    return '';
  }

  addCard(): void {
    this.cards.push({
      icon: '',
      text: ''
    });
  }

  removeCard(index: number): void {
    if (this.cards.length <= 1) {
      this.errorMessage = 'At least one mission card is required.';
      return;
    }

    this.cards.splice(index, 1);
    this.errorMessage = '';
  }

  onMissionImageSelected(event: Event): void {
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

    this.missionImage = file;
    this.missionImagePreview = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  onMissionSecondaryImageSelected(event: Event): void {
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

    this.missionSecondaryImage = file;
    this.missionSecondaryImagePreview = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  saveMission(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the mission title.';
      return;
    }

    if (this.cards.some(card => !card.icon.trim() || !card.text.trim())) {
      this.errorMessage = 'Please complete the icon and text for every card.';
      return;
    }

    const content = {
      title: this.title.trim(),
      cards: this.cards.map(card => ({
        icon: card.icon.trim(),
        text: card.text.trim()
      }))
    };

    this.isSaving = true;

    const request = this.isExistingContent
      ? this.api.updateMissionAPI(
          content,
          this.missionImage,
          this.missionSecondaryImage
        )
      : this.api.addMissionAPI(
          content,
          this.missionImage,
          this.missionSecondaryImage
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
          this.isExistingContent = true;
          this.missionImage = null;
          this.missionSecondaryImage = null;

          this.successMessage =
            response?.message || 'Mission content saved successfully.';

          this.loadMission();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to save mission content:', error);

          this.errorMessage =
            error?.error?.message ||
            'Unable to save mission content. Please try again.';

          this.cdr.markForCheck();
        }
      });
  }

  deleteMission(): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete the Our Mission content?'
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.api.deleteMissionAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.title = 'Our Mission';

          this.cards = [
            {
              icon: 'shield',
              text: 'To safeguard the livelihoods of Telangana’s handloom weavers'
            },
            {
              icon: 'megaphone',
              text: 'To preserve and promote traditional weaving techniques.'
            },
            {
              icon: 'fairness',
              text: 'To ensure fair wages and dignified working conditions for artisans'
            },
            {
              icon: 'accessibility',
              text: 'To make authentic handloom products accessible to a wider audience.'
            },
            {
              icon: 'sustainability',
              text: 'To champion sustainable, slow-fashion practices rooted in Telangana’s textile heritage.'
            }
          ];

          this.missionImage = null;
          this.missionSecondaryImage = null;
          this.missionImageUrl = '';
          this.missionSecondaryImageUrl = '';
          this.missionImagePreview = '';
          this.missionSecondaryImagePreview = '';
          this.isExistingContent = false;

          this.successMessage = 'Mission content deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete mission content:', error);

          this.errorMessage =
            error?.error?.message ||
            'Unable to delete mission content.';

          this.cdr.markForCheck();
        }
      });
  }
}
