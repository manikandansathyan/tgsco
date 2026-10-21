import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Api } from '../../../core/services/api';

interface RegionalOffice {
  id: string;
  slug: string;
  regionId: string;
  mapLabel: string;
  officeName: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  directionsLabel: string;
  directionsUrl: string;
  mapImageAlt: string;
  imageUrl: string;
  previewUrl: string;
  imageFile: File | null;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.html',
  styleUrl: './map.css',
})
export class Map implements OnInit, OnDestroy {
  private api = inject(Api);
  private subscriptions = new Subscription();

  eyebrow = 'Regional Map';
  title = 'Regional Map';

  navigation = {
    previousLabel: 'Previous',
    nextLabel: 'Next',
    counterFormat: '01 / 03',
  };

  mapImageAlt = 'Telangana regional district map';
  mapImageUrl = '';
  mapImagePreview = '';
  mapImageFile: File | null = null;

  offices: RegionalOffice[] = [];

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isEditMode = false;

  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadRegionalMap();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearAllPreviews();
  }

  private defaultOffices(): RegionalOffice[] {
    return [
      {
        id: 'hyderabad-head-office',
        slug: 'hyderabad-head-office',
        regionId: 'hyderabad',
        mapLabel: 'Hyderabad',
        officeName: 'TGSCO Head Office, Hyderabad',
        address: 'Nampally, Hyderabad, Telangana 500001',
        phone: '+91 40 2323 XXXX',
        email: 'info@tgsco.telangana.gov.in',
        hours: 'Mon-Sat, 10:00 AM - 6:00 PM',
        directionsLabel: 'Get Direction',
        directionsUrl:
          'https://maps.google.com/?q=TGSCO+Head+Office+Hyderabad',
        mapImageAlt: 'TGSCO Head Office, Hyderabad',
        imageUrl: '',
        previewUrl: '',
        imageFile: null,
      },
      {
        id: 'khammam-regional-office',
        slug: 'khammam-regional-office',
        regionId: 'khammam',
        mapLabel: 'Khammam',
        officeName: 'TGSCO Regional Office, Khammam',
        address: 'Regional Office, Khammam, Telangana 507001',
        phone: '+91 40 2323 1111',
        email: 'khammam@tgsco.telangana.gov.in',
        hours: 'Mon-Sat, 10:00 AM - 6:00 PM',
        directionsLabel: 'Get Direction',
        directionsUrl: 'https://maps.google.com/?q=Khammam+Telangana',
        mapImageAlt: 'TGSCO Regional Office, Khammam',
        imageUrl: '',
        previewUrl: '',
        imageFile: null,
      },
      {
        id: 'medak-regional-office',
        slug: 'medak-regional-office',
        regionId: 'medak',
        mapLabel: 'Medak',
        officeName: 'TGSCO Regional Office, Medak',
        address: 'Main Road, Medak, Telangana 502110',
        phone: '+91 40 2323 2222',
        email: 'medak@tgsco.telangana.gov.in',
        hours: 'Mon-Sat, 10:00 AM - 6:00 PM',
        directionsLabel: 'Get Direction',
        directionsUrl: 'https://maps.google.com/?q=Medak+Telangana',
        mapImageAlt: 'TGSCO Regional Office, Medak',
        imageUrl: '',
        previewUrl: '',
        imageFile: null,
      },
    ];
  }

  private defaultOffice(index: number): RegionalOffice {
    return {
      id: `regional-office-${index + 1}`,
      slug: `regional-office-${index + 1}`,
      regionId: `region-${index + 1}`,
      mapLabel: '',
      officeName: '',
      address: '',
      phone: '',
      email: '',
      hours: '',
      directionsLabel: 'Get Direction',
      directionsUrl: '',
      mapImageAlt: '',
      imageUrl: '',
      previewUrl: '',
      imageFile: null,
    };
  }

  private clearPreview(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private clearAllPreviews(): void {
    this.clearPreview(this.mapImagePreview);

    this.offices.forEach((office) => {
      this.clearPreview(office.previewUrl);
    });
  }

  private extractPayload(response: any): any {
    let data = response?.data ?? response;

    if (data?.content !== undefined) {
      if (typeof data.content === 'string') {
        try {
          data = JSON.parse(data.content);
        } catch {
          // Keep the response if content is not JSON.
        }
      } else if (
        typeof data.content === 'object' &&
        data.content !== null
      ) {
        data = data.content;
      }
    }

    return data;
  }

  private imageUrl(value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    if (!value || typeof value !== 'object') {
      return '';
    }

    for (const key of [
      'url',
      'imageUrl',
      'image_url',
      'mapImageUrl',
      'mapImage',
      'image',
      'src',
    ]) {
      const candidate = value[key];

      if (typeof candidate === 'string') {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const nested = this.imageUrl(candidate);

        if (nested) {
          return nested;
        }
      }
    }

    return '';
  }

  loadRegionalMap(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api.getRegionalMap().subscribe({
        next: (response: any) => {
          const data = this.extractPayload(response);

          this.clearAllPreviews();

          this.eyebrow = data?.eyebrow ?? 'Regional Map';
          this.title = data?.title ?? 'Regional Map';

          this.navigation = {
            previousLabel:
              data?.navigation?.previousLabel ?? 'Previous',
            nextLabel: data?.navigation?.nextLabel ?? 'Next',
            counterFormat:
              data?.navigation?.counterFormat ?? '01 / 03',
          };

          this.mapImageAlt =
            data?.mapImageAlt ?? 'Telangana regional district map';

          this.mapImageUrl = this.imageUrl(
            data?.mapImageUrl ?? data?.mapImage ?? data?.image
          );

          this.mapImagePreview = this.mapImageUrl;
          this.mapImageFile = null;

          const receivedRegions = Array.isArray(data?.regions)
            ? data.regions
            : [];

          const receivedLocations = receivedRegions.flatMap(
            (region: any) =>
              (
                Array.isArray(region?.locations)
                  ? region.locations
                  : []
              ).map((location: any) => ({
                ...location,
                id: location?.id ?? '',
                slug: location?.slug ?? location?.id ?? '',
                regionId: region?.regionId ?? '',
                mapLabel: region?.regionName ?? '',
                officeName: location?.title ?? '',
                hours: location?.timing ?? '',
                directionsLabel: 'Get Direction',
                directionsUrl: location?.directionUrl ?? '',
                mapImageAlt: location?.title ?? '',
                imageUrl: this.imageUrl(location?.image),
              }))
          );

          const defaults = this.defaultOffices();

          this.offices = receivedLocations.length
            ? receivedLocations.map((item: any, index: number) => {
                const fallback =
                  defaults[index] ?? this.defaultOffice(index);

                const url = this.imageUrl(
                  item?.imageUrl ?? item?.image
                );

                return {
                  ...fallback,
                  ...item,
                  id: item?.id || fallback.id,
                  slug: item?.slug || fallback.slug,
                  regionId: item?.regionId || fallback.regionId,
                  mapLabel: item?.mapLabel ?? fallback.mapLabel,
                  officeName:
                    item?.officeName ?? fallback.officeName,
                  address: item?.address ?? fallback.address,
                  phone: item?.phone ?? fallback.phone,
                  email: item?.email ?? fallback.email,
                  hours: item?.hours ?? fallback.hours,
                  directionsLabel:
                    item?.directionsLabel ?? 'Get Direction',
                  directionsUrl: item?.directionsUrl ?? '',
                  mapImageAlt:
                    item?.mapImageAlt ?? item?.officeName ?? '',
                  imageUrl: url,
                  previewUrl: url,
                  imageFile: null,
                };
              })
            : defaults;

          this.isEditMode =
            receivedRegions.length > 0 ||
            !!data?.eyebrow ||
            !!data?.title;

          this.isLoading = false;
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message ??
            'Unable to load Regional Map content.';
        },
      })
    );
  }

  loadOffice(index: number): void {
    const office = this.offices[index];

    if (!office?.id.trim()) {
      this.errorMessage = 'Enter an office ID before fetching its details.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api.getRegionalMapItem(office.id.trim()).subscribe({
        next: (response: any) => {
          const item = this.extractPayload(response);
          const current = this.offices[index];

          if (!item) {
            this.errorMessage = 'No office details were returned.';
            return;
          }

          const location = item?.location ?? item;
          const url = this.imageUrl(
            location?.image ?? location?.imageUrl
          );

          this.clearPreview(current.previewUrl);

          this.offices[index] = {
            ...current,
            id: location?.id ?? current.id,
            slug: location?.slug ?? current.slug,
            officeName: location?.title ?? current.officeName,
            address: location?.address ?? current.address,
            phone: location?.phone ?? current.phone,
            email: location?.email ?? current.email,
            hours: location?.timing ?? current.hours,
            directionsUrl:
              location?.directionUrl ?? current.directionsUrl,
            imageUrl: url || current.imageUrl,
            previewUrl: url || current.previewUrl,
            imageFile: null,
          };

          this.successMessage = 'Office details loaded.';
        },
        error: (error: any) => {
          this.errorMessage =
            error?.error?.message ??
            'Unable to load this regional office.';
        },
      })
    );
  }

  onMapImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid map image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'The map image must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.clearPreview(this.mapImagePreview);

    this.mapImageFile = file;
    this.mapImagePreview = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  onOfficeImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid office image.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Each office image must not exceed 5 MB.';
      input.value = '';
      return;
    }

    const office = this.offices[index];

    this.clearPreview(office.previewUrl);

    office.imageFile = file;
    office.previewUrl = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  addOffice(): void {
    this.offices.push(this.defaultOffice(this.offices.length));
  }

  removeOffice(index: number): void {
    if (!confirm('Remove this office from the regional map content?')) {
      return;
    }

    this.clearPreview(this.offices[index].previewUrl);
    this.offices.splice(index, 1);
  }

  saveRegionalMap(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.eyebrow.trim()) {
      this.errorMessage = 'Please enter the eyebrow text.';
      return;
    }

    if (this.offices.length === 0) {
      this.errorMessage = 'Add at least one regional office.';
      return;
    }

    for (const office of this.offices) {
      if (
        !office.id.trim() ||
        !office.regionId.trim() ||
        !office.mapLabel.trim() ||
        !office.officeName.trim() ||
        !office.address.trim()
      ) {
        this.errorMessage =
          'Each office must have a region ID, region name, office ID, office name, and address.';
        return;
      }
    }

    const regions = this.offices.map((office, index) => ({
      regionId: office.regionId.trim(),
      regionName: office.mapLabel.trim(),
      locations: [
        {
          id: office.id.trim(),
          title: office.officeName.trim(),
          image: `regions[${index}].locations[0].image`,
          address: office.address.trim(),
          phone: office.phone.trim(),
          email: office.email.trim(),
          timing: office.hours.trim(),
          directionUrl: office.directionsUrl.trim(),
        },
      ],
    }));

    const content = {
      eyebrow: this.eyebrow.trim(),
      regions,
    };

    const itemImages: Record<number, File> = {};

    this.offices.forEach((office, index) => {
      if (office.imageFile) {
        itemImages[index] = office.imageFile;
      }
    });

    this.isSaving = true;

    const request = this.isEditMode
      ? this.api.updateRegionalMap(content, itemImages)
      : this.api.createRegionalMap(content, itemImages);

    this.subscriptions.add(
      request.subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = this.isEditMode
            ? 'Regional Map updated successfully.'
            : 'Regional Map created successfully.';

          this.loadRegionalMap();
        },
        error: (error: any) => {
          this.isSaving = false;
          this.errorMessage =
            error?.error?.message ??
            'Unable to save Regional Map content.';
        },
      })
    );
  }

  deleteRegionalMap(): void {
    if (!this.isEditMode) {
      return;
    }

    if (
      !confirm(
        'Are you sure you want to delete the entire Regional Map content?'
      )
    ) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptions.add(
      this.api.deleteRegionalMap().subscribe({
        next: () => {
          this.isDeleting = false;
          this.clearAllPreviews();

          this.eyebrow = 'Regional Map';
          this.title = 'Regional Map';

          this.navigation = {
            previousLabel: 'Previous',
            nextLabel: 'Next',
            counterFormat: '01 / 03',
          };

          this.mapImageAlt = 'Telangana regional district map';
          this.mapImageUrl = '';
          this.mapImagePreview = '';
          this.mapImageFile = null;

          this.offices = this.defaultOffices();
          this.isEditMode = false;

          this.successMessage =
            'Regional Map content deleted successfully.';
        },
        error: (error: any) => {
          this.isDeleting = false;
          this.errorMessage =
            error?.error?.message ??
            'Unable to delete Regional Map content.';
        },
      })
    );
  }

  resetForm(): void {
    if (
      confirm('Discard unsaved changes and reload Regional Map content?')
    ) {
      this.loadRegionalMap();
    }
  }
}
