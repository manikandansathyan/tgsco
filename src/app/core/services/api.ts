import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface HeroImageUpload {
  index: number;
  file: File;
}

@Injectable({
  providedIn: 'root',
})
export class Api {

  baseURL: string = 'https://tgsco.onrender.com/api/v1'

  constructor(private http: HttpClient) { }

  // to append token after login
  appendToken() {
    let headers = new HttpHeaders()
    let token = sessionStorage.getItem('token')
    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`)
    }
    return { headers }
  }

  // build multipart form data for create and update
  buildHeroFormData(content: object, images: HeroImageUpload[]) {
    const formData = new FormData()
    formData.append('content', JSON.stringify(content))

    // field name matches the backend imageField, e.g. "slides[1].image"
    images.forEach(({ index, file }) => {
      formData.append(`slides[${index}].image`, file, file.name)
    })

    return formData
  }

  // public: homepage hero
  getPublicHeroAPI() {
    return this.http.get(`${this.baseURL}/home-content/hero`)
  }

  // admin: view hero
  getHeroAPI() {
    return this.http.get(`${this.baseURL}/home-content/hero`, this.appendToken())
  }

  // admin: create hero
  addHeroAPI(content: object, images: HeroImageUpload[]) {
    return this.http.post(
      `${this.baseURL}/home-content/hero`,
      this.buildHeroFormData(content, images),
      this.appendToken()
    )
  }

  // admin: update hero
  updateHeroAPI(content: object, images: HeroImageUpload[]) {
    return this.http.patch(
      `${this.baseURL}/home-content/hero`,
      this.buildHeroFormData(content, images),
      this.appendToken()
    )
  }

  // admin: delete the whole hero section
  deleteHeroAPI() {
    return this.http.delete(`${this.baseURL}/home-content/hero`, this.appendToken())
  }



  // Our Story

  getPublicOurStoryAPI() {
    return this.http.get(`${this.baseURL}/home-content/our-story`);
  }

  getOurStoryAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/our-story`,
      this.appendToken()
    );
  }

  addOurStoryAPI(content: object, storyImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (storyImage) {
      formData.append('storyImage', storyImage, storyImage.name);
    }

    return this.http.post(
      `${this.baseURL}/home-content/our-story`,
      formData,
      this.appendToken()
    );
  }

  updateOurStoryAPI(content: object, storyImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (storyImage) {
      formData.append('storyImage', storyImage, storyImage.name);
    }

    return this.http.patch(
      `${this.baseURL}/home-content/our-story`,
      formData,
      this.appendToken()
    );
  }

  deleteOurStoryAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/our-story`,
      this.appendToken()
    );
  }



  // Techniques

  getPublicTechniquesAPI() {
    return this.http.get(`${this.baseURL}/home-content/techniques`);
  }

  getTechniquesAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/techniques`,
      this.appendToken()
    );
  }

  addTechniquesAPI(
    content: object,
    backgroundImage: File | null,
    items: {
      index: number;
      mainImage: File | null;
      borderImage: File | null;
    }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (backgroundImage) {
      formData.append('backgroundImage', backgroundImage, backgroundImage.name);
    }

    items.forEach((item) => {
      if (item.mainImage) {
        formData.append(
          `items[${item.index}].mainImage`,
          item.mainImage,
          item.mainImage.name
        );
      }

      if (item.borderImage) {
        formData.append(
          `items[${item.index}].borderImage`,
          item.borderImage,
          item.borderImage.name
        );
      }
    });

    return this.http.post(
      `${this.baseURL}/home-content/techniques`,
      formData,
      this.appendToken()
    );
  }

  updateTechniquesAPI(
    content: object,
    backgroundImage: File | null,
    items: {
      index: number;
      mainImage: File | null;
      borderImage: File | null;
    }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (backgroundImage) {
      formData.append('backgroundImage', backgroundImage, backgroundImage.name);
    }

    items.forEach((item) => {
      if (item.mainImage) {
        formData.append(
          `items[${item.index}].mainImage`,
          item.mainImage,
          item.mainImage.name
        );
      }

      if (item.borderImage) {
        formData.append(
          `items[${item.index}].borderImage`,
          item.borderImage,
          item.borderImage.name
        );
      }
    });

    return this.http.patch(
      `${this.baseURL}/home-content/techniques`,
      formData,
      this.appendToken()
    );
  }

  deleteTechniquesAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/techniques`,
      this.appendToken()
    );
  }



  // Weaves / Journey of a Weave

  getPublicJourneyAPI() {
    return this.http.get(`${this.baseURL}/home-content/journey`);
  }

  getJourneyAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/journey`,
      this.appendToken()
    );
  }

  addJourneyAPI(content: object) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    return this.http.post(
      `${this.baseURL}/home-content/journey`,
      formData,
      this.appendToken()
    );
  }

  updateJourneyAPI(content: object) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    return this.http.patch(
      `${this.baseURL}/home-content/journey`,
      formData,
      this.appendToken()
    );
  }

  deleteJourneyAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/journey`,
      this.appendToken()
    );
  }

  getPublicMakersAPI() {
    return this.http.get(`${this.baseURL}/home-content/makers`);
  }

  getMakersAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/makers`,
      this.appendToken()
    );
  }

  getMakerBySlugAPI(slug: string) {
    return this.http.get(
      `${this.baseURL}/home-content/makers/items/${encodeURIComponent(slug)}`,
      this.appendToken()
    );
  }

  addMakersAPI(content: object, images: (File | null)[]) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((image, index) => {
      if (image) {
        formData.append(`makers[${index}].image`, image);
      }
    });

    return this.http.post(
      `${this.baseURL}/home-content/makers`,
      formData,
      this.appendToken()
    );
  }

  updateMakersAPI(content: object, images: (File | null)[]) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((image, index) => {
      if (image) {
        formData.append(`makers[${index}].image`, image);
      }
    });

    return this.http.patch(
      `${this.baseURL}/home-content/makers`,
      formData,
      this.appendToken()
    );
  }

  deleteMakersAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/makers`,
      this.appendToken()
    );
  }


  getPublicWhyChooseUsAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/why-choose-us`
    );
  }

  getWhyChooseUsAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/why-choose-us`,
      this.appendToken()
    );
  }

  addWhyChooseUsAPI(content: object) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    return this.http.post(
      `${this.baseURL}/home-content/why-choose-us`,
      formData,
      this.appendToken()
    );
  }

  updateWhyChooseUsAPI(content: object) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    return this.http.patch(
      `${this.baseURL}/home-content/why-choose-us`,
      formData,
      this.appendToken()
    );
  }

  deleteWhyChooseUsAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/why-choose-us`,
      this.appendToken()
    );
  }


  getPublicFeaturedCollectionsAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/featured-collections`
    );
  }

  getFeaturedCollectionsAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/featured-collections`,
      this.appendToken()
    );
  }

  addFeaturedCollectionsAPI(
    content: object,
    images: {
      index: number;
      mainImage?: File | null;
      borderImage?: File | null;
    }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((item) => {
      if (item.mainImage) {
        formData.append(
          `items[${item.index}].mainImage`,
          item.mainImage
        );
      }

      if (item.borderImage) {
        formData.append(
          `items[${item.index}].borderImage`,
          item.borderImage
        );
      }
    });

    return this.http.post(
      `${this.baseURL}/home-content/featured-collections`,
      formData,
      this.appendToken()
    );
  }

  updateFeaturedCollectionsAPI(
    content: object,
    images: {
      index: number;
      mainImage?: File | null;
      borderImage?: File | null;
    }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((item) => {
      if (item.mainImage) {
        formData.append(
          `items[${item.index}].mainImage`,
          item.mainImage
        );
      }

      if (item.borderImage) {
        formData.append(
          `items[${item.index}].borderImage`,
          item.borderImage
        );
      }
    });

    return this.http.patch(
      `${this.baseURL}/home-content/featured-collections`,
      formData,
      this.appendToken()
    );
  }

  deleteFeaturedCollectionsAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/featured-collections`,
      this.appendToken()
    );
  }



  getPublicGovernmentInitiativesAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/government-initiatives`
    );
  }

  getGovernmentInitiativesAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/government-initiatives`,
      this.appendToken()
    );
  }

  addGovernmentInitiativesAPI(
    content: object,
    initiativeImage?: File | null
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (initiativeImage) {
      formData.append('initiativeImage', initiativeImage);
    }

    return this.http.post(
      `${this.baseURL}/home-content/government-initiatives`,
      formData,
      this.appendToken()
    );
  }

  updateGovernmentInitiativesAPI(
    content: object,
    initiativeImage?: File | null
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (initiativeImage) {
      formData.append('initiativeImage', initiativeImage);
    }

    return this.http.patch(
      `${this.baseURL}/home-content/government-initiatives`,
      formData,
      this.appendToken()
    );
  }

  deleteGovernmentInitiativesAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/government-initiatives`,
      this.appendToken()
    );
  }


  getPublicBlogAPI() {
    return this.http.get(`${this.baseURL}/home-content/blog`);
  }

  getBlogAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/blog`,
      this.appendToken()
    );
  }

  addBlogAPI(
    content: object,
    images: { index: number; image: File | null }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((item) => {
      if (item.image) {
        formData.append(`articles[${item.index}].image`, item.image);
      }
    });

    return this.http.post(
      `${this.baseURL}/home-content/blog`,
      formData,
      this.appendToken()
    );
  }

  updateBlogAPI(
    content: object,
    images: { index: number; image: File | null }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((item) => {
      if (item.image) {
        formData.append(`articles[${item.index}].image`, item.image);
      }
    });

    return this.http.patch(
      `${this.baseURL}/home-content/blog`,
      formData,
      this.appendToken()
    );
  }

  deleteBlogAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/blog`,
      this.appendToken()
    );
  }

  getPublicNewsEventsAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/news-events`
    );
  }

  getNewsEventsAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/news-events`,
      this.appendToken()
    );
  }

  addNewsEventsAPI(
    content: object,
    images: { index: number; image: File | null }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((item) => {
      if (item.image) {
        formData.append(`cards[${item.index}].image`, item.image);
      }
    });

    return this.http.post(
      `${this.baseURL}/home-content/news-events`,
      formData,
      this.appendToken()
    );
  }

  updateNewsEventsAPI(
    content: object,
    images: { index: number; image: File | null }[]
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    images.forEach((item) => {
      if (item.image) {
        formData.append(`cards[${item.index}].image`, item.image);
      }
    });

    return this.http.patch(
      `${this.baseURL}/home-content/news-events`,
      formData,
      this.appendToken()
    );
  }

  deleteNewsEventsAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/news-events`,
      this.appendToken()
    );
  }


  // --------------------------------------------------------------------\\
  // ------------------------ ABOUT SECTION -----------------------------\\
  // --------------------------------------------------------------------\\

  getPublicAboutHeroAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/about-hero`
    );
  }

  getAboutHeroAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/about-hero`,
      this.appendToken()
    );
  }

  addAboutHeroAPI(content: object, heroImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.post(
      `${this.baseURL}/about-content/about-hero`,
      formData,
      this.appendToken()
    );
  }

  updateAboutHeroAPI(content: object, heroImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.patch(
      `${this.baseURL}/about-content/about-hero`,
      formData,
      this.appendToken()
    );
  }

  deleteAboutHeroAPI() {
    return this.http.delete(
      `${this.baseURL}/about-content/about-hero`,
      this.appendToken()
    );
  }


  getPublicWhoWeAreAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/who-we-are`
    );
  }

  getWhoWeAreAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/who-we-are`,
      this.appendToken()
    );
  }

  addWhoWeAreAPI(content: object, primaryImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (primaryImage) {
      formData.append('primaryImage', primaryImage);
    }

    return this.http.post(
      `${this.baseURL}/about-content/who-we-are`,
      formData,
      this.appendToken()
    );
  }

  updateWhoWeAreAPI(content: object, primaryImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (primaryImage) {
      formData.append('primaryImage', primaryImage);
    }

    return this.http.patch(
      `${this.baseURL}/about-content/who-we-are`,
      formData,
      this.appendToken()
    );
  }

  deleteWhoWeAreAPI() {
    return this.http.delete(
      `${this.baseURL}/about-content/who-we-are`,
      this.appendToken()
    );
  }


  getPublicMilestonesAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/milestones`
    );
  }

  getMilestonesAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/milestones`,
      this.appendToken()
    );
  }

  addMilestonesAPI(content: object) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    return this.http.post(
      `${this.baseURL}/about-content/milestones`,
      formData,
      this.appendToken()
    );
  }

  updateMilestonesAPI(content: object) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    return this.http.patch(
      `${this.baseURL}/about-content/milestones`,
      formData,
      this.appendToken()
    );
  }

  deleteMilestonesAPI() {
    return this.http.delete(
      `${this.baseURL}/about-content/milestones`,
      this.appendToken()
    );
  }


  getPublicVisionAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/vision`
    );
  }

  getVisionAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/vision`,
      this.appendToken()
    );
  }

  addVisionAPI(content: object, visionImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (visionImage) {
      formData.append('visionImage', visionImage);
    }

    return this.http.post(
      `${this.baseURL}/about-content/vision`,
      formData,
      this.appendToken()
    );
  }

  updateVisionAPI(content: object, visionImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (visionImage) {
      formData.append('visionImage', visionImage);
    }

    return this.http.patch(
      `${this.baseURL}/about-content/vision`,
      formData,
      this.appendToken()
    );
  }

  deleteVisionAPI() {
    return this.http.delete(
      `${this.baseURL}/about-content/vision`,
      this.appendToken()
    );
  }


  getPublicMissionAPI() {
    return this.http.get(`${this.baseURL}/about-content/mission`);
  }

  getMissionAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/mission`,
      this.appendToken()
    );
  }

  addMissionAPI(
    content: object,
    missionImage: File | null,
    missionSecondaryImage: File | null
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (missionImage) {
      formData.append('missionImage', missionImage);
    }

    if (missionSecondaryImage) {
      formData.append('missionSecondaryImage', missionSecondaryImage);
    }

    return this.http.post(
      `${this.baseURL}/about-content/mission`,
      formData,
      this.appendToken()
    );
  }

  updateMissionAPI(
    content: object,
    missionImage: File | null,
    missionSecondaryImage: File | null
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (missionImage) {
      formData.append('missionImage', missionImage);
    }

    if (missionSecondaryImage) {
      formData.append('missionSecondaryImage', missionSecondaryImage);
    }

    return this.http.patch(
      `${this.baseURL}/about-content/mission`,
      formData,
      this.appendToken()
    );
  }

  deleteMissionAPI() {
    return this.http.delete(
      `${this.baseURL}/about-content/mission`,
      this.appendToken()
    );
  }


  getPublicPurposeAPI() {
    return this.http.get(`${this.baseURL}/about-content/purpose`);
  }

  getPurposeAPI() {
    return this.http.get(
      `${this.baseURL}/about-content/purpose`,
      this.appendToken()
    );
  }

  addPurposeAPI(content: object, purposeImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (purposeImage) {
      formData.append('purposeImage', purposeImage);
    }

    return this.http.post(
      `${this.baseURL}/about-content/purpose`,
      formData,
      this.appendToken()
    );
  }

  updatePurposeAPI(content: object, purposeImage: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (purposeImage) {
      formData.append('purposeImage', purposeImage);
    }

    return this.http.patch(
      `${this.baseURL}/about-content/purpose`,
      formData,
      this.appendToken()
    );
  }

  deletePurposeAPI() {
    return this.http.delete(
      `${this.baseURL}/about-content/purpose`,
      this.appendToken()
    );
  }

  getSchemesHero() {
    return this.http.get(
      `${this.baseURL}/scheme-content/schemes-hero`,
      this.appendToken()
    );
  }

  createSchemesHero(
    content: {
      title: string;
      imageField: string;
      imageAlt: string;
    },
    heroImage?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.post(
      `${this.baseURL}/scheme-content/schemes-hero`,
      formData,
      this.appendToken()
    );
  }

  updateSchemesHero(
    content: {
      title: string;
      imageField: string;
      imageAlt: string;
    },
    heroImage?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.patch(
      `${this.baseURL}/scheme-content/schemes-hero`,
      formData,
      this.appendToken()
    );
  }

  deleteSchemesAPI() {
    return this.http.delete(
      `${this.baseURL}/scheme-content/schemes-hero`,
      this.appendToken()
    );
  }

  getSupportingWeavers() {
    return this.http.get(
      `${this.baseURL}/scheme-content/supporting-weavers`,
      this.appendToken()
    );
  }

  createSupportingWeavers(
    content: {
      eyebrow: string;
      title: string;
      description: string;
      imageField: string;
      imageAlt: string;
    },
    supportingImage?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (supportingImage) {
      formData.append('supportingImage', supportingImage);
    }

    return this.http.post(
      `${this.baseURL}/scheme-content/supporting-weavers`,
      formData,
      this.appendToken()
    );
  }

  updateSupportingWeavers(
    content: {
      eyebrow: string;
      title: string;
      description: string;
      imageField: string;
      imageAlt: string;
    },
    supportingImage?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (supportingImage) {
      formData.append('supportingImage', supportingImage);
    }

    return this.http.patch(
      `${this.baseURL}/scheme-content/supporting-weavers`,
      formData,
      this.appendToken()
    );
  }

  deleteSupportingWeavers() {
    return this.http.delete(
      `${this.baseURL}/scheme-content/supporting-weavers`,
      this.appendToken()
    );
  }


  getCurrentSchemes() {
    return this.http.get(
      `${this.baseURL}/scheme-content/current-schemes`,
      this.appendToken()
    );
  }

  createCurrentSchemes(
    content: Record<string, any>,
    schemeImage?: File,
    detailImages: Record<string, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (schemeImage) {
      formData.append('schemeImage', schemeImage);
    }

    Object.entries(detailImages).forEach(([fieldName, file]) => {
      formData.append(fieldName, file);
    });

    return this.http.post(
      `${this.baseURL}/scheme-content/current-schemes`,
      formData,
      this.appendToken()
    );
  }

  updateCurrentSchemes(
    content: Record<string, any>,
    schemeImage?: File,
    detailImages: Record<string, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (schemeImage) {
      formData.append('schemeImage', schemeImage);
    }

    Object.entries(detailImages).forEach(([fieldName, file]) => {
      formData.append(fieldName, file);
    });

    return this.http.patch(
      `${this.baseURL}/scheme-content/current-schemes`,
      formData,
      this.appendToken()
    );
  }

  deleteCurrentSchemes() {
    return this.http.delete(
      `${this.baseURL}/scheme-content/current-schemes`,
      this.appendToken()
    );
  }


  getHeritageHero() {
    return this.http.get(
      `${this.baseURL}/heritage-content/heritage-hero`,
      this.appendToken()
    );
  }

  createHeritageHero(content: Record<string, any>, heroImage?: File) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.post(
      `${this.baseURL}/heritage-content/heritage-hero`,
      formData,
      this.appendToken()
    );
  }

  updateHeritageHero(content: Record<string, any>, heroImage?: File) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.patch(
      `${this.baseURL}/heritage-content/heritage-hero`,
      formData,
      this.appendToken()
    );
  }

  deleteHeritageHero() {
    return this.http.delete(
      `${this.baseURL}/heritage-content/heritage-hero`,
      this.appendToken()
    );
  }

  getChainOfCraft() {
    return this.http.get(
      `${this.baseURL}/heritage-content/chain-of-craft`,
      this.appendToken()
    );
  }

  createChainOfCraft(content: Record<string, any>, roleImages: Record<number, File> = {}) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(roleImages).forEach(([index, file]) => {
      formData.append(`roles[${index}].image`, file);
    });

    return this.http.post(
      `${this.baseURL}/heritage-content/chain-of-craft`,
      formData,
      this.appendToken()
    );
  }

  updateChainOfCraft(content: Record<string, any>, roleImages: Record<number, File> = {}) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(roleImages).forEach(([index, file]) => {
      formData.append(`roles[${index}].image`, file);
    });

    return this.http.patch(
      `${this.baseURL}/heritage-content/chain-of-craft`,
      formData,
      this.appendToken()
    );
  }

  deleteChainOfCraft() {
    return this.http.delete(
      `${this.baseURL}/heritage-content/chain-of-craft`,
      this.appendToken()
    );
  }

  getHeritageNumbers() {
    return this.http.get(
      `${this.baseURL}/heritage-content/numbers`,
      this.appendToken()
    );
  }

  createHeritageNumbers(
    content: Record<string, any>,
    decorativeIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (decorativeIcon) {
      formData.append('decorativeIcon', decorativeIcon);
    }

    return this.http.post(
      `${this.baseURL}/heritage-content/numbers`,
      formData,
      this.appendToken()
    );
  }

  updateHeritageNumbers(
    content: Record<string, any>,
    decorativeIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (decorativeIcon) {
      formData.append('decorativeIcon', decorativeIcon);
    }

    return this.http.patch(
      `${this.baseURL}/heritage-content/numbers`,
      formData,
      this.appendToken()
    );
  }

  deleteHeritageNumbers() {
    return this.http.delete(
      `${this.baseURL}/heritage-content/numbers`,
      this.appendToken()
    );
  }


  getHeritageSustainability() {
    return this.http.get(
      `${this.baseURL}/heritage-content/sustainability`,
      this.appendToken()
    );
  }

  createHeritageSustainability(
    content: Record<string, any>,
    images: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(images).forEach(([index, file]) => {
      formData.append(`images[${index}].image`, file);
    });

    return this.http.post(
      `${this.baseURL}/heritage-content/sustainability`,
      formData,
      this.appendToken()
    );
  }

  updateHeritageSustainability(
    content: Record<string, any>,
    images: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(images).forEach(([index, file]) => {
      formData.append(`images[${index}].image`, file);
    });

    return this.http.patch(
      `${this.baseURL}/heritage-content/sustainability`,
      formData,
      this.appendToken()
    );
  }

  deleteHeritageSustainability() {
    return this.http.delete(
      `${this.baseURL}/heritage-content/sustainability`,
      this.appendToken()
    );
  }


  getHeritageMissionGuides() {
    return this.http.get(
      `${this.baseURL}/heritage-content/mission-guides`,
      this.appendToken()
    );
  }

  createHeritageMissionGuides(
    content: Record<string, any>,
    personImages: Record<number, File> = {},
    decorativeIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(personImages).forEach(([index, file]) => {
      formData.append(`people[${index}].image`, file);
    });

    if (decorativeIcon) {
      formData.append('decorativeIcon', decorativeIcon);
    }

    return this.http.post(
      `${this.baseURL}/heritage-content/mission-guides`,
      formData,
      this.appendToken()
    );
  }

  updateHeritageMissionGuides(
    content: Record<string, any>,
    personImages: Record<number, File> = {},
    decorativeIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(personImages).forEach(([index, file]) => {
      formData.append(`people[${index}].image`, file);
    });

    if (decorativeIcon) {
      formData.append('decorativeIcon', decorativeIcon);
    }

    return this.http.patch(
      `${this.baseURL}/heritage-content/mission-guides`,
      formData,
      this.appendToken()
    );
  }

  deleteHeritageMissionGuides() {
    return this.http.delete(
      `${this.baseURL}/heritage-content/mission-guides`,
      this.appendToken()
    );
  }

  getHeritageAwards() {
    return this.http.get(
      `${this.baseURL}/heritage-content/awards`,
      this.appendToken()
    );
  }

  createHeritageAwards(
    content: Record<string, any>,
    awardImages: Record<number, File> = {},
    decorativeIcon?: File | null
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(awardImages).forEach(([index, file]) => {
      formData.append(`awards[${index}].image`, file);
    });

    if (decorativeIcon) {
      formData.append('decorativeIcon', decorativeIcon);
    }

    return this.http.post(
      `${this.baseURL}/heritage-content/awards`,
      formData,
      this.appendToken()
    );
  }

  updateHeritageAwards(
    content: Record<string, any>,
    awardImages: Record<number, File> = {},
    decorativeIcon?: File | null
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(awardImages).forEach(([index, file]) => {
      formData.append(`awards[${index}].image`, file);
    });

    if (decorativeIcon) {
      formData.append('decorativeIcon', decorativeIcon);
    }

    return this.http.patch(
      `${this.baseURL}/heritage-content/awards`,
      formData,
      this.appendToken()
    );
  }

  deleteHeritageAwards() {
    return this.http.delete(
      `${this.baseURL}/heritage-content/awards`,
      this.appendToken()
    );
  }

  getNewsHero() {
    return this.http.get(
      `${this.baseURL}/news-content/news-hero`,
      this.appendToken()
    );
  }

  createNewsHero(content: Record<string, any>, heroImage?: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.post(
      `${this.baseURL}/news-content/news-hero`,
      formData,
      this.appendToken()
    );
  }

  updateNewsHero(content: Record<string, any>, heroImage?: File | null) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.patch(
      `${this.baseURL}/news-content/news-hero`,
      formData,
      this.appendToken()
    );
  }

  deleteNewsHero() {
    return this.http.delete(
      `${this.baseURL}/news-content/news-hero`,
      this.appendToken()
    );
  }

  getLatestNews() {
    return this.http.get(
      `${this.baseURL}/news-content/latest-news`,
      this.appendToken()
    );
  }

  createLatestNews(
    content: Record<string, any>,
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    return this.http.post(
      `${this.baseURL}/news-content/latest-news`,
      formData,
      this.appendToken()
    );
  }

  updateLatestNews(
    content: Record<string, any>,
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    return this.http.patch(
      `${this.baseURL}/news-content/latest-news`,
      formData,
      this.appendToken()
    );
  }

  deleteLatestNews() {
    return this.http.delete(
      `${this.baseURL}/news-content/latest-news`,
      this.appendToken()
    );
  }

  getExhibitions() {
    return this.http.get(
      `${this.baseURL}/news-content/exhibitions`,
      this.appendToken()
    );
  }

  createExhibitions(
    content: Record<string, any>,
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    return this.http.post(
      `${this.baseURL}/news-content/exhibitions`,
      formData,
      this.appendToken()
    );
  }

  updateExhibitions(
    content: Record<string, any>,
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    return this.http.patch(
      `${this.baseURL}/news-content/exhibitions`,
      formData,
      this.appendToken()
    );
  }

  deleteExhibitions() {
    return this.http.delete(
      `${this.baseURL}/news-content/exhibitions`,
      this.appendToken()
    );
  }

  getEventsCalendar() {
    return this.http.get(
      `${this.baseURL}/news-content/events-calendar`,
      this.appendToken()
    );
  }

  createEventsCalendar(
    content: Record<string, any>,
    itemImages: Record<number, File> = {},
    calendarIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    if (calendarIcon) {
      formData.append('calendarIcon', calendarIcon);
    }

    return this.http.post(
      `${this.baseURL}/news-content/events-calendar`,
      formData,
      this.appendToken()
    );
  }

  updateEventsCalendar(
    content: Record<string, any>,
    itemImages: Record<number, File> = {},
    calendarIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    if (calendarIcon) {
      formData.append('calendarIcon', calendarIcon);
    }

    return this.http.patch(
      `${this.baseURL}/news-content/events-calendar`,
      formData,
      this.appendToken()
    );
  }

  deleteEventsCalendar() {
    return this.http.delete(
      `${this.baseURL}/news-content/events-calendar`,
      this.appendToken()
    );
  }

  getPressReleases() {
    return this.http.get(
      `${this.baseURL}/news-content/press-releases`,
      this.appendToken()
    );
  }

  createPressReleases(
    content: Record<string, any>,
    itemImages: Record<number, File> = {},
    sliderIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    if (sliderIcon) {
      formData.append('sliderIcon', sliderIcon);
    }

    return this.http.post(
      `${this.baseURL}/news-content/press-releases`,
      formData,
      this.appendToken()
    );
  }

  updatePressReleases(
    content: Record<string, any>,
    itemImages: Record<number, File> = {},
    sliderIcon?: File
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].image`, file);
    });

    if (sliderIcon) {
      formData.append('sliderIcon', sliderIcon);
    }

    return this.http.patch(
      `${this.baseURL}/news-content/press-releases`,
      formData,
      this.appendToken()
    );
  }

  deletePressReleases() {
    return this.http.delete(
      `${this.baseURL}/news-content/press-releases`,
      this.appendToken()
    );
  }


  getThreadsOfTriumph() {
    return this.http.get(
      `${this.baseURL}/news-content/threads-of-triumph`,
      this.appendToken()
    );
  }

  getFeaturedWeaver(id: string) {
    return this.http.get(
      `${this.baseURL}/news-content/threads-of-triumph/items/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }

  createThreadsOfTriumph(
    content: Record<string, any>,
    images: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(images).forEach(([index, file]) => {
      formData.append(`items[${index}].mainImage`, file);
    });

    return this.http.post(
      `${this.baseURL}/news-content/threads-of-triumph`,
      formData,
      this.appendToken()
    );
  }

  updateThreadsOfTriumph(
    content: Record<string, any>,
    images: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(images).forEach(([index, file]) => {
      formData.append(`items[${index}].mainImage`, file);
    });

    return this.http.patch(
      `${this.baseURL}/news-content/threads-of-triumph`,
      formData,
      this.appendToken()
    );
  }

  deleteThreadsOfTriumph() {
    return this.http.delete(
      `${this.baseURL}/news-content/threads-of-triumph`,
      this.appendToken()
    );
  }


  getMediaGallery() {
    return this.http.get(
      `${this.baseURL}/news-content/media-gallery`,
      this.appendToken()
    );
  }

  getMediaGalleryCategory(id: string) {
    return this.http.get(
      `${this.baseURL}/news-content/media-gallery/items/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }

  createMediaGallery(
    content: Record<string, any>,
    mainImages: Record<number, File> = {},
    associatedImages: Record<string, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(mainImages).forEach(([index, file]) => {
      formData.append(`categories[${index}].mainImage`, file);
    });

    Object.entries(associatedImages).forEach(([field, file]) => {
      formData.append(field, file);
    });

    return this.http.post(
      `${this.baseURL}/news-content/media-gallery`,
      formData,
      this.appendToken()
    );
  }

  updateMediaGallery(
    content: Record<string, any>,
    mainImages: Record<number, File> = {},
    associatedImages: Record<string, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(mainImages).forEach(([index, file]) => {
      formData.append(`categories[${index}].mainImage`, file);
    });

    Object.entries(associatedImages).forEach(([field, file]) => {
      formData.append(field, file);
    });

    return this.http.patch(
      `${this.baseURL}/news-content/media-gallery`,
      formData,
      this.appendToken()
    );
  }

  deleteMediaGallery() {
    return this.http.delete(
      `${this.baseURL}/news-content/media-gallery`,
      this.appendToken()
    );
  }


  getContactHero() {
    return this.http.get(
      `${this.baseURL}/contact-content/contact-hero`,
      this.appendToken()
    );
  }

  createContactHero(content: Record<string, any>, heroImage?: File) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.post(
      `${this.baseURL}/contact-content/contact-hero`,
      formData,
      this.appendToken()
    );
  }

  updateContactHero(content: Record<string, any>, heroImage?: File) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (heroImage) {
      formData.append('heroImage', heroImage);
    }

    return this.http.patch(
      `${this.baseURL}/contact-content/contact-hero`,
      formData,
      this.appendToken()
    );
  }

  deleteContactHero() {
    return this.http.delete(
      `${this.baseURL}/contact-content/contact-hero`,
      this.appendToken()
    );
  }


  getRegionalMap() {
    return this.http.get(
      `${this.baseURL}/contact-content/regional-map`,
      this.appendToken()
    );
  }

  getRegionalMapItem(id: string) {
    return this.http.get(
      `${this.baseURL}/contact-content/regional-map/items/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }

  createRegionalMap(
    content: Record<string, any>,
    mapImage?: File,
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (mapImage) {
      formData.append('mapImage', mapImage);
    }

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].mapImage`, file);
    });

    return this.http.post(
      `${this.baseURL}/contact-content/regional-map`,
      formData,
      this.appendToken()
    );
  }

  updateRegionalMap(
    content: Record<string, any>,
    mapImage?: File,
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (mapImage) {
      formData.append('mapImage', mapImage);
    }

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(`items[${index}].mapImage`, file);
    });

    return this.http.patch(
      `${this.baseURL}/contact-content/regional-map`,
      formData,
      this.appendToken()
    );
  }

  deleteRegionalMap() {
    return this.http.delete(
      `${this.baseURL}/contact-content/regional-map`,
      this.appendToken()
    );
  }


  getContactForm() {
    return this.http.get(
      `${this.baseURL}/contact-content/contact-form`,
      this.appendToken()
    );
  }

  createContactForm(content: Record<string, any>, formImage?: File) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (formImage) {
      formData.append('formImage', formImage);
    }

    return this.http.post(
      `${this.baseURL}/contact-content/contact-form`,
      formData,
      this.appendToken()
    );
  }

  updateContactForm(content: Record<string, any>, formImage?: File) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    if (formImage) {
      formData.append('formImage', formImage);
    }

    return this.http.patch(
      `${this.baseURL}/contact-content/contact-form`,
      formData,
      this.appendToken()
    );
  }

  deleteContactForm() {
    return this.http.delete(
      `${this.baseURL}/contact-content/contact-form`,
      this.appendToken()
    );
  }


  getFaq() {
    return this.http.get(
      `${this.baseURL}/contact-content/faq`,
      this.appendToken()
    );
  }

  createFaq(content: Record<string, any>) {
    const formData = new FormData();
    formData.append('content', JSON.stringify(content));

    return this.http.post(
      `${this.baseURL}/contact-content/faq`,
      formData,
      this.appendToken()
    );
  }

  updateFaq(content: Record<string, any>) {
    const formData = new FormData();
    formData.append('content', JSON.stringify(content));

    return this.http.patch(
      `${this.baseURL}/contact-content/faq`,
      formData,
      this.appendToken()
    );
  }

  deleteFaq() {
    return this.http.delete(
      `${this.baseURL}/contact-content/faq`,
      this.appendToken()
    );
  }


  getContactInquiries() {
    return this.http.get(
      `${this.baseURL}/contact-inquiries`,
      this.appendToken()
    );
  }

  createContactInquiry(inquiry: {
    name: string;
    email: string;
    phone: string;
    message: string;
  }) {
    return this.http.post(
      `${this.baseURL}/contact-inquiries`,
      inquiry
    );
  }



  uploadVideo(video: File) {
    const formData = new FormData();
    formData.append('video', video);

    return this.http.post(
      `${this.baseURL}/media/videos`,
      formData,
      this.appendToken()
    );
  }

  deleteVideo(key: string) {
    return this.http.delete(
      `${this.baseURL}/media/videos`,
      {
        ...this.appendToken(),
        body: { key },
      }
    );
  }

}
