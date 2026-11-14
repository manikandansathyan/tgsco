
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, timeout } from 'rxjs';
import { Api } from '../../../core/services/api';

type Section = 'groups' | 'categories' | 'products';
type ProductMode = 'regular' | 'bulk';
type ImageField = 'mainImage' | 'image';

interface ProductSizeRow {
  size: string;
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  stockQuantity: number | null;
}

interface BulkPricingRow {
  minimumQuantity: number | null;
  maximumQuantity: number | null;
  price: number | null;
}

interface CatalogueForm {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  groupId: string;
  categoryId: string;
  categorySlug: string;
  sku: string;
  type: string;
  color: string;
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  currency: string;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  reorderQuantity: number | null;
  sortOrder: number | null;
  active: boolean;
  overview: string;
  craftStory: string;
  materialCare: string;
  shippingReturns: string;
  attributes: string;
}

@Component({
  selector: 'app-catalogue-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogue-detail.html',
  styleUrl: './catalogue-detail.css',
})
export class CatalogueDetail implements OnInit, OnDestroy {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private routeSubscription?: Subscription;

  section: Section = 'groups';

  loading = false;
  saving = false;
  deleting = false;
  groupsLoading = false;
  categoriesLoading = false;

  showForm = false;
  showDetails = false;
  isEditing = false;

  editingId = '';

  errorMessage = '';
  successMessage = '';

  searchTerm = '';
  statusFilter = 'all';

  items: any[] = [];
  filteredItems: any[] = [];
  groups: any[] = [];
  categories: any[] = [];

  selectedItem: any = null;

  productMode: ProductMode = 'regular';

  selectedMainImage: File | null = null;
  selectedGalleryImages: File[] = [];

  mainImagePreview = '';
  imagePreview = '';
  galleryImagePreviews: string[] = [];

  sizeEntries: ProductSizeRow[] = [this.emptySize()];

  bulkPricingRows: BulkPricingRow[] = [
    {
      minimumQuantity: null,
      maximumQuantity: null,
      price: null,
    },
  ];

  form: CatalogueForm = this.emptyForm();

  get pageTitle(): string {
    switch (this.section) {
      case 'groups':
        return 'Catalogue Groups';
      case 'categories':
        return 'Catalogue Categories';
      case 'products':
        return 'Catalogue Products';
      default:
        return 'Catalogue';
    }
  }

  get pageDescription(): string {
    switch (this.section) {
      case 'groups':
        return 'Manage your product groups.';
      case 'categories':
        return 'Manage categories and their group assignments.';
      case 'products':
        return 'Manage products, pricing, stock and product sizes.';
      default:
        return 'Manage your catalogue.';
    }
  }

  get sectionLabel(): string {
    return this.section.charAt(0).toUpperCase() + this.section.slice(1);
  }

  get formTitle(): string {
    const sectionName =
      this.section === 'groups'
        ? 'Group'
        : this.section === 'categories'
          ? 'Category'
          : 'Product';

    return `${this.isEditing ? 'Edit' : 'Create'} ${sectionName}`;
  }

  // -----------------------------
  // LIFECYCLE
  // -----------------------------

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const routeSection = params.get('section');

      if (
        routeSection === 'groups' ||
        routeSection === 'categories' ||
        routeSection === 'products'
      ) {
        this.section = routeSection;
      } else {
        const currentUrl = this.router.url;

        if (currentUrl.includes('categories')) {
          this.section = 'categories';
        } else if (currentUrl.includes('products')) {
          this.section = 'products';
        } else {
          this.section = 'groups';
        }
      }

      this.resetForm();
      this.searchTerm = '';
      this.statusFilter = 'all';

      this.loadGroups();

      if (this.section === 'products') {
        this.loadCategories();
      }

      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  // -----------------------------
  // EMPTY FORM DATA
  // -----------------------------

  private emptyForm(): CatalogueForm {
    return {
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      groupId: '',
      categoryId: '',
      categorySlug: '',
      sku: '',
      type: '',
      color: '',
      price: null,
      originalPrice: null,
      discountPercent: null,
      currency: 'INR',
      stockQuantity: null,
      lowStockThreshold: null,
      reorderQuantity: null,
      sortOrder: 0,
      active: true,
      overview: '',
      craftStory: '',
      materialCare: '',
      shippingReturns: '',
      attributes: '',
    };
  }

  private emptySize(): ProductSizeRow {
    return {
      size: '',
      price: null,
      originalPrice: null,
      discountPercent: null,
      stockQuantity: null,
    };
  }

  // -----------------------------
  // LOAD DATA
  // -----------------------------

  loadGroups(): void {
    this.groupsLoading = true;

    this.api
      .getCatalogueGroupsAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.groupsLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.groups = this.extractItems(response);
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error loading groups:', error);
          this.groups = [];
          this.cdr.markForCheck();
        },
      });
  }

  loadCategories(): void {
    this.categoriesLoading = true;

    this.api
      .getCatalogueCategoriesAPI()
      .pipe(
        timeout(60000),
        finalize(() => {
          this.categoriesLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.categories = this.extractItems(response);
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error('Error loading categories:', error);
          this.categories = [];
          this.cdr.markForCheck();
        },
      });
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    let request: any;

    switch (this.section) {
      case 'groups':
        request = this.api.getCatalogueGroupsAPI();
        break;

      case 'categories':
        request = this.api.getCatalogueCategoriesAPI();
        break;

      case 'products':
        request = this.api.getCatalogueProductsAPI();
        break;
    }

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.items = this.extractItems(response);

          if (this.section === 'categories') {
            this.categories = this.items;
          }

          this.applyFilters();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error(`Error loading ${this.section}:`, error);

          this.items = [];
          this.filteredItems = [];

          this.errorMessage =
            error?.error?.message ||
            error?.error?.error?.message ||
            error?.message ||
            `Unable to load ${this.section}. Please try again.`;

          this.cdr.markForCheck();
        },
      });
  }

  private extractItems(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.groups)) return response.data.groups;
    if (Array.isArray(response?.data?.categories)) return response.data.categories;
    if (Array.isArray(response?.data?.products)) return response.data.products;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.groups)) return response.groups;
    if (Array.isArray(response?.categories)) return response.categories;
    if (Array.isArray(response?.products)) return response.products;

    return [];
  }

  // -----------------------------
  // GROUP AND CATEGORY DROPDOWNS
  // -----------------------------

  onGroupChange(): void {
    // Clear the previously selected category when the group changes.
    this.form.categoryId = '';
    this.form.categorySlug = '';

    this.cdr.markForCheck();
  }

  getFilteredCategories(): any[] {
    if (!this.form.groupId) {
      return [];
    }

    return this.categories.filter((category: any) => {
      const categoryGroupId = this.getCategoryGroupId(category);

      return categoryGroupId === String(this.form.groupId);
    });
  }

  private getCategoryGroupId(category: any): string {
    const groupReference =
      category?.groupId ??
      category?.group ??
      category?.catalogueGroup ??
      category?.catalogueGroupId;

    if (groupReference && typeof groupReference === 'object') {
      return String(
        groupReference?._id ||
        groupReference?.id ||
        groupReference?.groupId ||
        ''
      );
    }

    return String(groupReference || '');
  }

  onCategoryChange(categoryId: string): void {
    const selectedCategory = this.categories.find(
      (category: any) => this.getId(category) === String(categoryId)
    );

    this.form.categoryId = categoryId || '';
    this.form.categorySlug = selectedCategory?.slug || '';

    this.cdr.markForCheck();
  }

  // -----------------------------
  // SEARCH AND FILTER
  // -----------------------------

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredItems = this.items.filter((item: any) => {
      const searchableText = [
        item?.name,
        item?.title,
        item?.slug,
        item?.sku,
        item?.shortDescription,
        item?.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      const isActive = item?.active ?? item?.isActive ?? true;

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && isActive === true) ||
        (this.statusFilter === 'inactive' && isActive === false);

      return matchesSearch && matchesStatus;
    });

    this.cdr.markForCheck();
  }

  // -----------------------------
  // FORM OPEN / CLOSE
  // -----------------------------

  openCreateForm(): void {
    this.resetForm();

    this.showForm = true;
    this.isEditing = false;
    this.editingId = '';

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.markForCheck();
  }

  openCreateProductWithoutSize(): void {
    this.openCreateForm();

    this.productMode = 'regular';
    this.sizeEntries = [this.emptySize()];

    this.cdr.markForCheck();
  }

  openCreateProductWithSizes(): void {
    this.openCreateForm();

    this.productMode = 'bulk';
    this.sizeEntries = [this.emptySize()];

    this.cdr.markForCheck();
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
    this.cdr.markForCheck();
  }

  resetForm(): void {
    this.form = this.emptyForm();

    this.isEditing = false;
    this.editingId = '';

    this.productMode = 'regular';

    this.selectedMainImage = null;
    this.selectedGalleryImages = [];

    this.mainImagePreview = '';
    this.imagePreview = '';
    this.galleryImagePreviews = [];

    this.sizeEntries = [this.emptySize()];

    this.bulkPricingRows = [
      {
        minimumQuantity: null,
        maximumQuantity: null,
        price: null,
      },
    ];

    this.errorMessage = '';

    this.cdr.markForCheck();
  }

  // -----------------------------
  // DETAILS MODAL
  // -----------------------------

  viewItem(item: any): void {
    this.selectedItem = item;
    this.showDetails = true;
    this.cdr.markForCheck();
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedItem = null;
    this.cdr.markForCheck();
  }

  // -----------------------------
  // EDIT
  // -----------------------------

  editItem(item: any): void {
    if (!item) return;

    this.resetForm();

    this.showDetails = false;
    this.selectedItem = null;

    this.isEditing = true;
    this.showForm = true;

    this.editingId = String(
      item?._id ||
      item?.id ||
      item?.groupId ||
      item?.categoryId ||
      item?.productId ||
      ''
    );

    this.form = {
      ...this.emptyForm(),

      name: item?.name || '',
      slug: item?.slug || '',
      description: item?.description || '',
      shortDescription: item?.shortDescription || '',

      groupId:
        item?.groupId?._id ||
        item?.groupId?.id ||
        item?.groupId ||
        item?.group?._id ||
        item?.group?.id ||
        '',

      categoryId:
        item?.categoryId?._id ||
        item?.categoryId?.id ||
        item?.categoryId ||
        item?.category?._id ||
        item?.category?.id ||
        '',

      categorySlug: item?.categorySlug || item?.category?.slug || '',
      sku: item?.sku || '',
      type: item?.type || '',
      color: item?.color || '',

      price: item?.price ?? null,
      originalPrice: item?.originalPrice ?? null,
      discountPercent: item?.discountPercent ?? null,
      currency: item?.currency || 'INR',

      stockQuantity: item?.stockQuantity ?? null,
      lowStockThreshold: item?.lowStockThreshold ?? null,
      reorderQuantity: item?.reorderQuantity ?? null,

      sortOrder: item?.sortOrder ?? 0,
      active: item?.active ?? true,

      overview: item?.overview || '',
      craftStory: item?.craftStory || '',
      materialCare: item?.materialCare || '',
      shippingReturns: item?.shippingReturns || '',

      attributes:
        typeof item?.attributes === 'string'
          ? item.attributes
          : item?.attributes
            ? JSON.stringify(item.attributes, null, 2)
            : '',
    };

    if (this.section === 'products') {
      const sizes = Array.isArray(item?.sizes) ? item.sizes : [];

      this.productMode = sizes.length ? 'bulk' : 'regular';

      this.sizeEntries = sizes.length
        ? sizes.map((size: any): ProductSizeRow => ({
            size: size?.size || '',
            price: size?.price ?? null,
            originalPrice: size?.originalPrice ?? null,
            discountPercent: size?.discountPercent ?? null,
            stockQuantity: size?.stockQuantity ?? null,
          }))
        : [this.emptySize()];

      const pricing = Array.isArray(item?.bulkPricing)
        ? item.bulkPricing
        : [];

      this.bulkPricingRows = pricing.length
        ? pricing.map((row: any): BulkPricingRow => ({
            minimumQuantity:
              row?.minimumQuantity ?? row?.minQuantity ?? null,
            maximumQuantity:
              row?.maximumQuantity ?? row?.maxQuantity ?? null,
            price: row?.price ?? null,
          }))
        : [
            {
              minimumQuantity: null,
              maximumQuantity: null,
              price: null,
            },
          ];
    }

    this.mainImagePreview =
      this.getImageUrl(item?.mainImage) ||
      this.getImageUrl(item?.image) ||
      item?.mainImageUrl ||
      item?.imageUrl ||
      '';

    this.imagePreview = this.getImageUrl(item?.image) || '';

    this.cdr.markForCheck();
  }

  // -----------------------------
  // PRODUCT SIZE MANAGEMENT
  // -----------------------------

  addSize(): void {
    this.sizeEntries.push(this.emptySize());
    this.cdr.markForCheck();
  }

  removeSize(index: number): void {
    if (this.sizeEntries.length <= 1) return;

    this.sizeEntries.splice(index, 1);
    this.cdr.markForCheck();
  }

  addBulkPricing(): void {
    this.bulkPricingRows.push({
      minimumQuantity: null,
      maximumQuantity: null,
      price: null,
    });

    this.cdr.markForCheck();
  }

  removeBulkPricing(index: number): void {
    if (this.bulkPricingRows.length <= 1) return;

    this.bulkPricingRows.splice(index, 1);
    this.cdr.markForCheck();
  }

  // -----------------------------
  // IMAGE HANDLING
  // -----------------------------

  onImageSelected(event: Event, field: ImageField): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Image size must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.selectedMainImage = file;

    const reader = new FileReader();

    reader.onload = () => {
      const preview = String(reader.result || '');

      this.mainImagePreview = preview;
      this.imagePreview = preview;

      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file);
  }

  onMainImageSelected(event: Event): void {
    this.onImageSelected(event, 'mainImage');
  }

  onGalleryImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (!files.length) return;

    const invalidFile = files.find(
      (file) =>
        !file.type.startsWith('image/') ||
        file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      this.errorMessage =
        'Please select valid image files. Each image must be 5 MB or smaller.';
      input.value = '';
      return;
    }

    this.errorMessage = '';

    this.selectedGalleryImages = [
      ...this.selectedGalleryImages,
      ...files,
    ];

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        this.galleryImagePreviews.push(String(reader.result || ''));
        this.cdr.markForCheck();
      };

      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number): void {
    this.selectedGalleryImages.splice(index, 1);
    this.galleryImagePreviews.splice(index, 1);
    this.cdr.markForCheck();
  }

  // -----------------------------
  // PAYLOAD HELPERS
  // -----------------------------

  private parseAttributes(): Record<string, unknown> {
    if (!this.form.attributes.trim()) return {};

    try {
      return JSON.parse(this.form.attributes);
    } catch {
      throw new Error('Attributes must contain valid JSON.');
    }
  }

  private getSelectedCategory(): any {
    return this.categories.find(
      (category: any) =>
        this.getId(category) === String(this.form.categoryId)
    );
  }

  private buildBulkPricingPayload(): any[] {
    return this.bulkPricingRows
      .filter(
        (row) =>
          row.minimumQuantity !== null &&
          row.price !== null
      )
      .map((row) => ({
        minimumQuantity: Number(row.minimumQuantity),
        ...(row.maximumQuantity !== null
          ? { maximumQuantity: Number(row.maximumQuantity) }
          : {}),
        price: Number(row.price),
      }));
  }

  private buildSizesPayload(): any[] {
    return this.sizeEntries
      .filter(
        (size) =>
          size.size.trim() &&
          size.price !== null &&
          size.stockQuantity !== null
      )
      .map((size) => ({
        size: size.size.trim(),
        price: Number(size.price),
        ...(size.originalPrice !== null
          ? { originalPrice: Number(size.originalPrice) }
          : {}),
        ...(size.discountPercent !== null
          ? { discountPercent: Number(size.discountPercent) }
          : {}),
        stockQuantity: Number(size.stockQuantity),
      }));
  }

  private buildBulkProductPayload(): any {
    const selectedCategory = this.getSelectedCategory();
    const categoryId =
      this.form.categoryId ||
      selectedCategory?._id ||
      selectedCategory?.id ||
      selectedCategory?.categoryId ||
      '';

    return {
      name: this.form.name.trim(),
      slug: this.form.slug.trim(),
      groupId: this.form.groupId || undefined,
      categoryIds: categoryId ? [String(categoryId)] : [],
      color: this.form.color || undefined,
      shortDescription: this.form.shortDescription,
      description: this.form.description,
      price: this.form.price ?? undefined,
      originalPrice: this.form.originalPrice ?? undefined,
      discountPercent: this.form.discountPercent ?? undefined,
      currency: this.form.currency || 'INR',
      stockQuantity: this.form.stockQuantity ?? undefined,
      lowStockThreshold: this.form.lowStockThreshold ?? undefined,
      reorderQuantity: this.form.reorderQuantity ?? undefined,
      active: this.form.active,
      attributes: this.parseAttributes(),
      bulkPricing: this.buildBulkPricingPayload(),
      overview: this.form.overview,
      craftStory: this.form.craftStory,
      materialCare: this.form.materialCare,
      shippingReturns: this.form.shippingReturns,
      sizes: this.buildSizesPayload(),
      mainImage: this.selectedMainImage,
      galleryImages: this.selectedGalleryImages,
    };
  }

  private buildPayload(): any {
    const commonPayload: any = {
      name: this.form.name.trim(),
      slug: this.form.slug.trim(),
      active: this.form.active,
    };

    if (this.section === 'groups') {
      return {
        ...commonPayload,
        description: this.form.description,
        sortOrder: Number(this.form.sortOrder || 0),
        image: this.selectedMainImage,
      };
    }

    if (this.section === 'categories') {
      return {
        ...commonPayload,
        description: this.form.description,
        groupId: this.form.groupId,
        sortOrder: Number(this.form.sortOrder || 0),
        image: this.selectedMainImage,
      };
    }

    const attributes = this.parseAttributes();
    const selectedCategory = this.getSelectedCategory();

    const categoryId =
      this.form.categoryId ||
      selectedCategory?._id ||
      selectedCategory?.id ||
      selectedCategory?.categoryId ||
      '';

    const categorySlug =
      selectedCategory?.slug || this.form.categorySlug || '';

    const productPayload: any = {
      ...commonPayload,

      groupId: this.form.groupId || undefined,
      categoryId: categoryId || undefined,
      categorySlug: categorySlug || undefined,
      categorySlugs: categorySlug ? [categorySlug] : [],
      categoryIds: categoryId ? [String(categoryId)] : [],

      sku: this.form.sku || undefined,
      type: this.form.type || undefined,
      types: this.form.type ? [this.form.type] : [],

      color: this.form.color || undefined,
      shortDescription: this.form.shortDescription,
      description: this.form.description,

      price:
        this.form.price !== null
          ? Number(this.form.price)
          : undefined,

      originalPrice:
        this.form.originalPrice !== null
          ? Number(this.form.originalPrice)
          : undefined,

      discountPercent:
        this.form.discountPercent !== null
          ? Number(this.form.discountPercent)
          : undefined,

      currency: this.form.currency || 'INR',

      stockQuantity:
        this.form.stockQuantity !== null
          ? Number(this.form.stockQuantity)
          : undefined,

      lowStockThreshold:
        this.form.lowStockThreshold !== null
          ? Number(this.form.lowStockThreshold)
          : undefined,

      reorderQuantity:
        this.form.reorderQuantity !== null
          ? Number(this.form.reorderQuantity)
          : undefined,

      overview: this.form.overview,
      craftStory: this.form.craftStory,
      materialCare: this.form.materialCare,
      shippingReturns: this.form.shippingReturns,

      attributes,
      bulkPricing: this.buildBulkPricingPayload(),

      mainImage: this.selectedMainImage,
      galleryImages: this.selectedGalleryImages,
    };

    if (this.productMode === 'bulk') {
      productPayload.sizes = this.buildSizesPayload();
    }

    return productPayload;
  }

  // -----------------------------
  // VALIDATION
  // -----------------------------

  private validateForm(): boolean {
    if (!this.form.name.trim()) {
      this.errorMessage = 'Please enter a name.';
      return false;
    }

    if (!this.form.slug.trim()) {
      this.errorMessage = 'Please enter a slug.';
      return false;
    }

    if (
      this.section === 'categories' &&
      !this.form.groupId
    ) {
      this.errorMessage = 'Please select a group.';
      return false;
    }

    if (this.section === 'products') {
      if (!this.form.groupId) {
        this.errorMessage = 'Please select a group.';
        return false;
      }

      if (!this.form.sku.trim()) {
        this.errorMessage = 'Please enter a product SKU.';
        return false;
      }

      if (!this.form.categoryId) {
        this.errorMessage = 'Please select a category.';
        return false;
      }

      if (
        this.productMode === 'regular' &&
        (this.form.price === null || Number(this.form.price) < 0)
      ) {
        this.errorMessage = 'Please enter a valid product price.';
        return false;
      }

      if (this.productMode === 'bulk') {
        const validSizes = this.buildSizesPayload();

        if (!validSizes.length) {
          this.errorMessage =
            'Please add at least one size with its price and stock quantity.';
          return false;
        }
      }
    }

    return true;
  }

  // -----------------------------
  // CREATE / UPDATE
  // -----------------------------

  saveItem(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateForm()) return;

    let payload: any;

    try {
      payload =
        this.section === 'products' &&
        !this.isEditing &&
        this.productMode === 'bulk'
          ? this.buildBulkProductPayload()
          : this.buildPayload();
    } catch (error: any) {
      this.errorMessage =
        error?.message || 'Please check the entered information.';
      return;
    }

    this.saving = true;

    let request: any;

    if (this.section === 'groups') {
      request = this.isEditing
        ? (this.api.updateCatalogueGroupAPI as any)(
            this.editingId,
            payload
          )
        : this.api.createCatalogueGroupAPI(payload);
    } else if (this.section === 'categories') {
      request = this.isEditing
        ? (this.api.updateCatalogueCategoryAPI as any)(
            this.editingId,
            payload
          )
        : this.api.createCatalogueCategoryAPI(payload);
    } else {
      if (this.isEditing) {
        request = this.api.updateCatalogueProductAPI(
          this.editingId,
          payload
        );
      } else if (this.productMode === 'bulk') {
        request = this.api.createCatalogueBulkProductAPI(payload);
      } else {
        request = this.api.createCatalogueProductAPI(payload);
      }
    }

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.errorMessage =
              response?.message ||
              response?.error?.message ||
              'Unable to save the item.';

            this.cdr.markForCheck();
            return;
          }

          this.successMessage = this.isEditing
            ? `${this.sectionLabel.slice(0, -1)} updated successfully.`
            : `${this.sectionLabel.slice(0, -1)} created successfully.`;

          this.showForm = false;
          this.resetForm();
          this.loadData();

          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error(`Error saving ${this.section}:`, error);

          this.errorMessage =
            error?.error?.message ||
            error?.error?.error?.message ||
            error?.message ||
            `Unable to save ${this.section}. Please try again.`;

          this.cdr.markForCheck();
        },
      });
  }

  // -----------------------------
  // DELETE
  // -----------------------------

  deleteItem(item: any): void {
    const id = String(
      item?._id ||
      item?.id ||
      item?.groupId ||
      item?.categoryId ||
      item?.productId ||
      ''
    );

    if (!id) {
      this.errorMessage = 'Unable to identify the item.';
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item?.name || 'this item'}"?`
    );

    if (!confirmed) return;

    this.deleting = true;
    this.errorMessage = '';

    let request: any;

    switch (this.section) {
      case 'groups':
        request = this.api.deleteCatalogueGroupAPI(id);
        break;
      case 'categories':
        request = this.api.deleteCatalogueCategoryAPI(id);
        break;
      case 'products':
        request = this.api.deleteCatalogueProductAPI(id);
        break;
    }

    request
      .pipe(
        timeout(60000),
        finalize(() => {
          this.deleting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response?.success === false) {
            this.errorMessage =
              response?.message ||
              response?.error?.message ||
              'Unable to delete the item.';

            this.cdr.markForCheck();
            return;
          }

          this.successMessage = 'Item deleted successfully.';
          this.loadData();
          this.cdr.markForCheck();
        },
        error: (error: any) => {
          console.error(`Error deleting ${this.section}:`, error);

          this.errorMessage =
            error?.error?.message ||
            error?.error?.error?.message ||
            error?.message ||
            'Unable to delete the item. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  // -----------------------------
  // HTML DISPLAY HELPERS
  // -----------------------------

  getName(item: any): string {
    return item?.name || item?.title || item?.label || 'Untitled';
  }

  getId(item: any): string {
    return String(
      item?._id ||
      item?.id ||
      item?.groupId ||
      item?.categoryId ||
      item?.productId ||
      ''
    );
  }

  getItemType(item: any): string {
    return (
      item?.type ||
      item?.category?.name ||
      item?.categorySlug ||
      '-'
    );
  }

  getPrice(item: any): number | string {
    const price = item?.price ?? item?.sizes?.[0]?.price;

    return price !== null && price !== undefined
      ? Number(price)
      : '—';
  }

  getCategoryNames(item: any): string {
    if (Array.isArray(item?.categories) && item.categories.length) {
      return item.categories
        .map((category: any) => this.getName(category))
        .join(', ');
    }

    if (Array.isArray(item?.categorySlugs) && item.categorySlugs.length) {
      return item.categorySlugs.join(', ');
    }

    if (item?.category?.name) return item.category.name;
    if (item?.categorySlug) return item.categorySlug;

    return '—';
  }

  getImageUrl(image: any): string {
    if (!image) return '';

    if (typeof image === 'string') return image;

    if (typeof image === 'object') {
      return (
        image?.url ||
        image?.secure_url ||
        image?.path ||
        image?.src ||
        ''
      );
    }

    return '';
  }

  // -----------------------------
  // NAVIGATION / OTHER HELPERS
  // -----------------------------

  goBack(): void {
    this.router.navigate(['/catalogue']);
  }

  refreshData(): void {
    this.loadGroups();

    if (this.section === 'products') {
      this.loadCategories();
    }

    this.loadData();
  }

  trackById(index: number, item: any): string | number {
    return item?._id || item?.id || index;
  }

  getGroupName(groupId: any): string {
    const id =
      typeof groupId === 'object'
        ? groupId?._id || groupId?.id
        : groupId;

    const group = this.groups.find(
      (item: any) =>
        String(item?._id || item?.id) === String(id)
    );

    return group?.name || '-';
  }

  generateSlug(): void {
    this.form.slug = this.form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
