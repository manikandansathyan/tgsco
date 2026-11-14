import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

interface Maker {
  id: string;
  slug: string;
  name: string;
  role: string;
  quote: string;
  imageField: string;
  imageAlt: string;
  imageUrl: string;
  imageFile: File | null;
}

@Component({
  selector: 'app-makers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meet-the-makers.html',
  styleUrl: './meet-the-makers.css',
})
export class MeetTheMakers implements OnInit {
  title = 'Meet the Makers';

  makers: Maker[] = [];

  previousLabel = 'Previous';
  nextLabel = 'Next';
  counterFormat = '01 / 05';

  isLoading = false;
  isSaving = false;
  isExistingContent = false;

  successMessage = '';
  errorMessage = '';

  private readonly defaultMakers: Maker[] = [
    {
      id: 'narsaiah-garu',
      slug: 'narsaiah-garu',
      name: 'Narsaiah Garu',
      role: 'Master Weaver - 40+ Years Experience',
      quote:
        'My mother taught me to weave before she taught me to read. This loom has fed three generations of my family, and I hope it will feed many more.',
      imageField: 'makers[0].image',
      imageAlt: 'Narsaiah Garu weaving at a handloom',
      imageUrl: '',
      imageFile: null,
    },
    {
      id: 'lakshmi-bai',
      slug: 'lakshmi-bai',
      name: 'Lakshmi Bai',
      role: 'Master Weaver - 35+ Years Experience',
      quote:
        'Every colour I weave carries a memory of our village and the hands that taught me this craft.',
      imageField: 'makers[1].image',
      imageAlt: 'Lakshmi Bai weaving a handloom textile',
      imageUrl: '',
      imageFile: null,
    },
    {
      id: 'ravi-kumar',
      slug: 'ravi-kumar',
      name: 'Ravi Kumar',
      role: 'Handloom Artisan - 25+ Years Experience',
      quote:
        'A handloom takes patience, but every finished thread reminds us why this tradition is worth protecting.',
      imageField: 'makers[2].image',
      imageAlt: 'Ravi Kumar working at a handloom',
      imageUrl: '',
      imageFile: null,
    },
    {
      id: 'savitri-devi',
      slug: 'savitri-devi',
      name: 'Savitri Devi',
      role: 'Weaver and Artisan - 30+ Years Experience',
      quote:
        'Our craft connects our family to the next generation. We weave so that the story continues.',
      imageField: 'makers[3].image',
      imageAlt: 'Savitri Devi creating handloom fabric',
      imageUrl: '',
      imageFile: null,
    },
    {
      id: 'mallesham',
      slug: 'mallesham',
      name: 'Mallesham',
      role: 'Master Weaver - 40+ Years Experience',
      quote:
        'The loom is more than a livelihood. It is a part of who we are and what we leave behind.',
      imageField: 'makers[4].image',
      imageAlt: 'Mallesham weaving traditional handloom fabric',
      imageUrl: '',
      imageFile: null,
    },
  ];

  constructor(
    private readonly api: Api,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resetToDefaults();
    this.loadMakers();
  }

  private resetToDefaults(): void {
    this.makers = this.defaultMakers.map((maker) => ({ ...maker }));
  }

  private createSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private createUniqueSlug(name: string, index: number): string {
    const baseSlug = this.createSlug(name) || `maker-${index + 1}`;

    const duplicateIndex = this.makers.findIndex(
      (maker, makerIndex) =>
        makerIndex !== index &&
        this.createSlug(maker.name) === baseSlug
    );

    return duplicateIndex !== -1
      ? `${baseSlug}-${index + 1}`
      : baseSlug;
  }

  private getMakerImageAlt(name: string, role: string): string {
    const makerName = name.trim();
    const makerRole = role.trim();

    if (makerName && makerRole) {
      return `${makerName} - ${makerRole}`;
    }

    return makerName
      ? `${makerName} - TGSCO artisan`
      : 'TGSCO artisan';
  }

  loadMakers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .getMakersAPI()
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
          const content = data?.content ?? data;

          if (content && Array.isArray(content.items)) {
            this.title = content.title ?? this.title;

            this.previousLabel =
              content.navigation?.previousLabel ?? 'Previous';

            this.nextLabel =
              content.navigation?.nextLabel ?? 'Next';

            this.counterFormat =
              content.navigation?.counterFormat ?? '01 / 05';

            const returnedImages: any[] = Array.isArray(data?.images)
              ? data.images
              : [];

            this.makers = content.items.map(
              (item: any, index: number): Maker => {
                const defaultMaker = this.defaultMakers[index];

                const imageField =
                  item.imageField ?? `makers[${index}].image`;

                const matchedImage = returnedImages.find(
                  (image: any) => image.field === imageField
                );

                const imageUrl =
                  matchedImage?.url ??
                  (typeof item.image === 'string'
                    ? item.image
                    : item.image?.url) ??
                  item.imageUrl ??
                  '';

                const name = item.name ?? '';
                const role = item.role ?? '';

                return {
                  id:
                    item.id ??
                    defaultMaker?.id ??
                    `maker-${index + 1}`,

                  slug:
                    item.slug ??
                    defaultMaker?.slug ??
                    this.createSlug(name),

                  name,
                  role,
                  quote: item.quote ?? '',
                  imageField,
                  imageAlt: this.getMakerImageAlt(name, role),
                  imageUrl,
                  imageFile: null,
                };
              }
            );

            this.isExistingContent = !!data?.id || !!content?.id;
          } else {
            this.resetToDefaults();
            this.isExistingContent = false;
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load makers:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to load makers. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  loadMakerDetails(index: number): void {
    const maker = this.makers[index];

    if (!maker?.slug) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .getMakerBySlugAPI(maker.slug)
      .pipe(timeout(60000))
      .subscribe({
        next: (response: any) => {
          const data = response?.data ?? response;
          const item = data?.content ?? data;

          if (item) {
            const name = item.name ?? maker.name;
            const role = item.role ?? maker.role;

            this.makers[index] = {
              ...maker,
              ...item,
              id: item.id ?? maker.id,
              slug: item.slug ?? maker.slug,
              name,
              role,
              quote: item.quote ?? maker.quote,
              imageField: item.imageField ?? maker.imageField,
              imageAlt: this.getMakerImageAlt(name, role),
              imageUrl:
                item.imageUrl ??
                item.image?.url ??
                (typeof item.image === 'string' ? item.image : '') ??
                maker.imageUrl,
              imageFile: maker.imageFile,
            };
          }

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to load maker details:', error);

          this.errorMessage =
            error?.error?.message ??
            `Unable to load details for ${maker.name}.`;

          this.cdr.markForCheck();
        },
      });
  }

  onImageSelected(event: Event, index: number): void {
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

    this.errorMessage = '';
    this.makers[index].imageFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.makers[index].imageUrl = String(reader.result ?? '');
      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file);
  }

  removeSelectedImage(index: number): void {
    this.makers[index].imageFile = null;
    this.makers[index].imageUrl = '';
    this.cdr.markForCheck();
  }

  saveMakers(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.title.trim()) {
      this.errorMessage = 'Please enter the section title.';
      return;
    }

    if (this.makers.length !== 5) {
      this.errorMessage = 'The section must contain exactly five makers.';
      return;
    }

    for (let i = 0; i < this.makers.length; i++) {
      const maker = this.makers[i];

      if (
        !maker.name.trim() ||
        !maker.role.trim() ||
        !maker.quote.trim()
      ) {
        this.errorMessage =
          `Please complete all text fields for maker ${i + 1}.`;
        return;
      }
    }

    const content = {
      title: this.title.trim(),

      items: this.makers.map((maker, index) => {
        const slug = this.createUniqueSlug(maker.name, index);
        const imageField = `makers[${index}].image`;
        const imageAlt = this.getMakerImageAlt(
          maker.name,
          maker.role
        );

        maker.slug = slug;
        maker.imageField = imageField;
        maker.imageAlt = imageAlt;

        return {
          id: maker.id,
          slug,
          name: maker.name.trim(),
          role: maker.role.trim(),
          quote: maker.quote.trim(),
          imageField,
          imageAlt,
        };
      }),

      navigation: {
        previousLabel: this.previousLabel.trim(),
        nextLabel: this.nextLabel.trim(),
        counterFormat: this.counterFormat.trim(),
      },
    };

    const images = this.makers.map((maker) => maker.imageFile);

    this.isSaving = true;

    const request = this.isExistingContent
      ? this.api.updateMakersAPI(content, images)
      : this.api.addMakersAPI(content, images);

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
          this.successMessage =
            response?.message ??
            (this.isExistingContent
              ? 'Makers section updated successfully.'
              : 'Makers section created successfully.');

          this.isExistingContent = true;

          this.makers.forEach((maker) => {
            maker.imageFile = null;
          });

          this.loadMakers();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to save makers:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to save the makers section. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  deleteMakers(): void {
    if (
      !window.confirm(
        'Are you sure you want to delete the entire Meet the Makers section?'
      )
    ) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api
      .deleteMakersAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.isSaving = false;
          this.api.scrollToTop();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.resetToDefaults();
          this.isExistingContent = false;
          this.successMessage = 'Makers section deleted successfully.';
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Failed to delete makers:', error);

          this.errorMessage =
            error?.error?.message ??
            'Unable to delete the makers section. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  trackByMaker(index: number, maker: Maker): string {
    return maker.id || String(index);
  }
}