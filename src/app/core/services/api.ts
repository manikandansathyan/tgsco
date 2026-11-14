import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface HeroImageUpload {
  index: number;
  file: File;
}

@Injectable({
  providedIn: 'root',
})
export class Api {

  // baseURL: string = 'https://tgscobackend.qmarkdesk.com/api/v1' //mainURL
  baseURL: string = 'https://tgsco.onrender.com/api/v1';


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
      `${this.baseURL}/scheme-content/current-schemes/items/chenetha-lakshmi-scheme`
    );
  }

  getGovernmentInitiativesAPI() {
    return this.http.get(
      `${this.baseURL}/scheme-content/current-schemes`,
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
      formData.append('schemes[0].image', initiativeImage);
    }

    return this.http.post(
      `${this.baseURL}/scheme-content/current-schemes`,
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
      formData.append('schemes[0].image', initiativeImage);
    }

    return this.http.patch(
      `${this.baseURL}/scheme-content/current-schemes`,
      formData,
      this.appendToken()
    );
  }

  deleteGovernmentInitiativesAPI() {
    return this.http.delete(
      `${this.baseURL}/scheme-content/current-schemes`,
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
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(
        `regions[${index}].locations[0].image`,
        file
      );
    });

    return this.http.post(
      `${this.baseURL}/contact-content/regional-map`,
      formData,
      this.appendToken()
    );
  }

  updateRegionalMap(
    content: Record<string, any>,
    itemImages: Record<number, File> = {}
  ) {
    const formData = new FormData();

    formData.append('content', JSON.stringify(content));

    Object.entries(itemImages).forEach(([index, file]) => {
      formData.append(
        `regions[${index}].locations[0].image`,
        file
      );
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



  //---------- Catalogue Management ----------\\

  // Build multipart form data for catalogue requests
  private buildCatalogueFormData(
    data: Record<string, unknown>,
    singleFileFields: string[] = [],
    multipleFileFields: string[] = []
  ): FormData {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (
        singleFileFields.includes(key) ||
        multipleFileFields.includes(key) ||
        value === undefined ||
        value === null
      ) {
        return;
      }

      if (Array.isArray(value) || typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    singleFileFields.forEach((field) => {
      const file = data[field];

      if (file instanceof File) {
        formData.append(field, file, file.name);
      }
    });

    multipleFileFields.forEach((field) => {
      const files = data[field];

      if (Array.isArray(files)) {
        files.forEach((file) => {
          if (file instanceof File) {
            formData.append(field, file, file.name);
          }
        });
      }
    });

    return formData;
  }

  // ---------------- CATALOGUE GROUPS ----------------

  // 3. List all catalogue groups
  getCatalogueGroupsAPI() {
    return this.http.get(
      `${this.baseURL}/catalog/admin/groups`,
      this.appendToken()
    );
  }

  // 4. Create catalogue group
  createCatalogueGroupAPI(data: {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;
    image?: File | null;
  }) {
    const formData = this.buildCatalogueFormData(
      data as unknown as Record<string, unknown>,
      ['image']
    );

    return this.http.post(
      `${this.baseURL}/catalog/admin/groups`,
      formData,
      this.appendToken()
    );
  }

  // 5. Update catalogue group
  updateCatalogueGroupAPI(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      image?: File | null;
    }
  ) {
    const formData = this.buildCatalogueFormData(
      data as Record<string, unknown>,
      ['image']
    );

    return this.http.patch(
      `${this.baseURL}/catalog/admin/groups/${encodeURIComponent(id)}`,
      formData,
      this.appendToken()
    );
  }

  // 6. Delete catalogue group
  deleteCatalogueGroupAPI(id: string) {
    return this.http.delete(
      `${this.baseURL}/catalog/admin/groups/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }

  // ---------------- CATEGORIES ----------------

  // 7. List all categories
  getCatalogueCategoriesAPI(type?: string) {
    let params = new HttpParams();

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get(
      `${this.baseURL}/catalog/admin/categories`,
      {
        ...this.appendToken(),
        params,
      }
    );
  }

  // 8. Get category by ID
  getCatalogueCategoryByIdAPI(id: string) {
    return this.http.get(
      `${this.baseURL}/catalog/admin/categories/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }

  // 1. Create category
  createCatalogueCategoryAPI(data: {
    name: string;
    slug: string;
    groupId?: string;
    description?: string;
    subtitle?: string;
    active?: boolean;
    type?: string;
    image?: File | null;
  }) {
    const formData = this.buildCatalogueFormData(
      data as unknown as Record<string, unknown>,
      ['image']
    );

    return this.http.post(
      `${this.baseURL}/catalog/admin/categories`,
      formData,
      this.appendToken()
    );
  }

  // 9. Update category
  updateCatalogueCategoryAPI(
    id: string,
    data: {
      name?: string;
      slug?: string;
      groupId?: string;
      description?: string;
      subtitle?: string;
      active?: boolean;
      type?: string;
      image?: File | null;
    }
  ) {
    const formData = this.buildCatalogueFormData(
      data as Record<string, unknown>,
      ['image']
    );

    return this.http.patch(
      `${this.baseURL}/catalog/admin/categories/${encodeURIComponent(id)}`,
      formData,
      this.appendToken()
    );
  }

  // 10. Delete category
  deleteCatalogueCategoryAPI(id: string) {
    return this.http.delete(
      `${this.baseURL}/catalog/admin/categories/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }

  // 15. List weaves categories
  getWeavesCategoriesAPI() {
    return this.getCatalogueCategoriesAPI('weaves');
  }

  // 16. List occasions categories
  getOccasionsCategoriesAPI() {
    return this.getCatalogueCategoriesAPI('occasions');
  }

  // 17. List fabric categories
  getFabricCategoriesAPI() {
    return this.getCatalogueCategoriesAPI('fabric');
  }

  // ---------------- PRODUCTS ----------------

  // 11. List all products
  getCatalogueProductsAPI() {
    return this.http.get(
      `${this.baseURL}/catalog/admin/products`,
      this.appendToken()
    );
  }

  // 12. Get product by ID
  getCatalogueProductByIdAPI(id: string) {
    return this.http.get(
      `${this.baseURL}/catalog/admin/products/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }

  // 2. Create product
  createCatalogueProductAPI(data: {
    name: string;
    slug: string;
    sku?: string;
    categorySlug?: string;
    type?: string;
    shortDescription?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    discountPercent?: number;
    currency?: string;
    stockQuantity?: number;
    active?: boolean;
    overview?: string;
    craftStory?: string;
    materialCare?: string;
    shippingReturns?: string;
    categorySlugs?: string[];
    categoryIds?: string[];
    types?: string[];
    attributes?: Record<string, unknown>;
    bulkPricing?: {
      minimumQuantity: number;
      maximumQuantity?: number;
      price: number;
    }[];
    mainImage?: File | null;
    galleryImages?: File[];
  }) {
    const formData = this.buildCatalogueFormData(
      data as unknown as Record<string, unknown>,
      ['mainImage'],
      ['galleryImages']
    );

    return this.http.post(
      `${this.baseURL}/catalog/admin/products`,
      formData,
      this.appendToken()
    );
  }


  createCatalogueBulkProductAPI(data: {
    name: string;
    slug: string;
    categoryIds?: string[];
    color?: string;
    shortDescription?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    discountPercent?: number;
    currency?: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    reorderQuantity?: number;
    active?: boolean;
    attributes?: Record<string, unknown>;
    bulkPricing?: {
      minimumQuantity: number;
      maximumQuantity?: number;
      price: number;
    }[];
    overview?: string;
    craftStory?: string;
    materialCare?: string;
    shippingReturns?: string;
    sizes?: {
      size: string;
      price: number;
      originalPrice?: number;
      discountPercent?: number;
      stockQuantity: number;
    }[];
    mainImage?: File | null;
    galleryImages?: File[];
    images?: File[];
  }) {
    const formData = new FormData();

    // Regular fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        key === 'mainImage' ||
        key === 'galleryImages' ||
        key === 'images'
      ) {
        return;
      }

      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    // Main image
    if (data.mainImage) {
      formData.append('mainImage', data.mainImage);
    }

    // Gallery images
    if (data.galleryImages?.length) {
      data.galleryImages.forEach((file) => {
        formData.append('galleryImages', file);
      });
    }

    // Additional indexed images
    if (data.images?.length) {
      data.images.forEach((file, index) => {
        formData.append(`images[${index}].url`, file);
      });
    }

    return this.http.post(
      `${this.baseURL}/catalog/admin/products/bulk`,
      formData,
      this.appendToken()
    );
  }

  // 13. Update product
  updateCatalogueProductAPI(
    id: string,
    data: {
      name?: string;
      slug?: string;
      sku?: string;
      categorySlug?: string;
      type?: string;
      shortDescription?: string;
      description?: string;
      price?: number;
      originalPrice?: number;
      discountPercent?: number;
      currency?: string;
      stockQuantity?: number;
      active?: boolean;
      overview?: string;
      craftStory?: string;
      materialCare?: string;
      shippingReturns?: string;
      categorySlugs?: string[];
      categoryIds?: string[];
      types?: string[];
      attributes?: Record<string, unknown>;
      bulkPricing?: {
        minimumQuantity: number;
        maximumQuantity?: number;
        price: number;
      }[];
      mainImage?: File | null;
      galleryImages?: File[];
    }
  ) {
    const formData = this.buildCatalogueFormData(
      data as unknown as Record<string, unknown>,
      ['mainImage'],
      ['galleryImages']
    );

    return this.http.patch(
      `${this.baseURL}/catalog/admin/products/${encodeURIComponent(id)}`,
      formData,
      this.appendToken()
    );
  }

  // 14. Delete product
  deleteCatalogueProductAPI(id: string) {
    return this.http.delete(
      `${this.baseURL}/catalog/admin/products/${encodeURIComponent(id)}`,
      this.appendToken()
    );
  }


  // COMMERCE MANAGEMENT \\

  // ==================== ADMIN ORDERS APIs ====================

  // 1. Get all orders with search, filters, sorting and pagination
  getAdminOrders(filters: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    from?: string;
    to?: string;
    sort?: 'newest' | 'oldest' | 'total';
    page?: number;
    limit?: number;
  } = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get(`${this.baseURL}/admin/orders`, {
      ...this.appendToken(),
      params,
    });
  }

  // 2. Get order filter options
  getAdminOrderFilters() {
    return this.http.get(
      `${this.baseURL}/admin/orders/filters`,
      this.appendToken()
    );
  }

  // 3. Get a single order by ID
  getAdminOrderById(orderId: string) {
    return this.http.get(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}`,
      this.appendToken()
    );
  }

  // 4. Update order status
  updateAdminOrderStatus(
    orderId: string,
    payload: {
      status: string;
      message?: string;
    }
  ) {
    return this.http.patch(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/status`,
      payload,
      this.appendToken()
    );
  }

  // 5. Create shipment
  createAdminOrderShipment(
    orderId: string,
    payload: {
      courier: string;
      trackingNumber: string;
      status: string;
      shippedAt?: string;
      estimatedDeliveryAt?: string;
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/shipment`,
      payload,
      this.appendToken()
    );
  }

  // 6. Update shipment details
  updateAdminOrderShipment(
    orderId: string,
    payload: {
      courier?: string;
      trackingNumber?: string;
      status?: string;
      shippedAt?: string;
      estimatedDeliveryAt?: string;
    }
  ) {
    return this.http.patch(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/shipment`,
      payload,
      this.appendToken()
    );
  }

  // 7. Update shipment status
  updateAdminOrderShipmentStatus(
    orderId: string,
    payload: {
      status: string;
    }
  ) {
    return this.http.patch(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/shipment/status`,
      payload,
      this.appendToken()
    );
  }

  // 8. Add an order note
  addAdminOrderNote(
    orderId: string,
    payload: {
      message: string;
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/notes`,
      payload,
      this.appendToken()
    );
  }

  // 9. Get order notes
  getAdminOrderNotes(orderId: string) {
    return this.http.get(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/notes`,
      this.appendToken()
    );
  }

  // 10. Cancel an order
  cancelAdminOrder(
    orderId: string,
    payload: {
      reason: string;
      refund?: {
        amount: number;
        status?: string;
        reference?: string;
      };
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/cancel`,
      payload,
      this.appendToken()
    );
  }

  // 11. Get order invoice
  getAdminOrderInvoice(orderId: string) {
    return this.http.get(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/invoice`,
      this.appendToken()
    );
  }

  // 12. Create a refund
  createAdminOrderRefund(
    orderId: string,
    payload: {
      amount: number;
      reason: string;
      notes?: Record<string, unknown>;
    },
    idempotencyKey: string
  ) {
    const headers = this.appendToken().headers.set(
      'Idempotency-Key',
      idempotencyKey
    );

    return this.http.post(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/refunds`,
      payload,
      { headers }
    );
  }

  // 13. Get a specific refund by order ID and refund ID
  getAdminOrderRefund(orderId: string, refundId: string) {
    return this.http.get(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`,
      this.appendToken()
    );
  }


  // General Settings
  getSettings() {
    return this.http.get(
      `${this.baseURL}/admin/settings`,
      this.appendToken()
    );
  }

  getSettingsMetadata() {
    return this.http.get(
      `${this.baseURL}/admin/settings/metadata`,
      this.appendToken()
    );
  }

  // Invoice Settings
  getInvoiceSettings() {
    return this.http.get(
      `${this.baseURL}/admin/settings/invoice`,
      this.appendToken()
    );
  }

  updateInvoiceSettings(data: any) {
    return this.http.put(
      `${this.baseURL}/admin/settings/invoice`,
      data,
      this.appendToken()
    );
  }

  // Shipping Settings
  getShippingSettings() {
    return this.http.get(
      `${this.baseURL}/admin/settings/shipping`,
      this.appendToken()
    );
  }

  createShippingSetting(data: any) {
    return this.http.post(
      `${this.baseURL}/admin/settings/shipping`,
      data,
      this.appendToken()
    );
  }

  updateShippingSetting(data: any) {
    return this.http.patch(
      `${this.baseURL}/admin/settings/shipping/`,
      data,
      this.appendToken()
    );
  }

  deleteShippingSetting() {
    return this.http.delete(
      `${this.baseURL}/admin/settings/shipping/`,
      this.appendToken()
    );
  }

  // Packing Settings
  getPackingSettings() {
    return this.http.get(
      `${this.baseURL}/admin/settings/packing`,
      this.appendToken()
    );
  }

  createPackingSetting(data: any) {
    return this.http.post(
      `${this.baseURL}/admin/settings/packing`,
      data,
      this.appendToken()
    );
  }

  updatePackingSetting(data: any) {
    return this.http.patch(
      `${this.baseURL}/admin/settings/packing/`,
      data,
      this.appendToken()
    );
  }

  deletePackingSetting() {
    return this.http.delete(
      `${this.baseURL}/admin/settings/packing/`,
      this.appendToken()
    );
  }

  // Additional Charges
  createSettingCharge(data: any) {
    return this.http.post(
      `${this.baseURL}/admin/settings/charges`,
      data,
      this.appendToken()
    );
  }

  updateSettingCharge(data: any) {
    return this.http.patch(
      `${this.baseURL}/admin/settings/charges/`,
      data,
      this.appendToken()
    );
  }

  deleteSettingCharge() {
    return this.http.delete(
      `${this.baseURL}/admin/settings/charges/`,
      this.appendToken()
    );
  }

  // ==================== RETURNS & REFUNDS APIs ====================


  /* 1. Get Order Cancellation and Return Policies */
  getAdminOrderPolicies() {
    return this.http.get(
      `${this.baseURL}/admin/settings/order-policies`,
      this.appendToken()
    );
  }

  /* 2. Update Order Cancellation and Return Policies */
  updateAdminOrderPolicies(data: {
    cancellationAllowedUntil: string;
    returnWindowDays: number;
  }) {
    return this.http.put(
      `${this.baseURL}/admin/settings/order-policies`,
      data,
      this.appendToken()
    );
  }

  /* 3. Get All Returns */
  getAdminReturns() {
    return this.http.get(
      `${this.baseURL}/admin/returns`,
      this.appendToken()
    );
  }

  /* 4. Update Return Status - Approve */
  approveAdminReturn(returnId: string) {
    return this.http.patch(
      `${this.baseURL}/admin/returns/${encodeURIComponent(returnId)}/status`,
      {
        status: 'approved',
        message: 'Approved',
      },
      this.appendToken()
    );
  }

  /* 5. Get Returns with Filters, Sorting and Pagination */
  getAdminReturnsWithFilters(filters: {
    status?: string;
    reason?: string;
    from?: string;
    to?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest';
  } = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get(
      `${this.baseURL}/admin/returns`,
      {
        ...this.appendToken(),
        params,
      }
    );
  }

  /* 6. Get Available Return Filter Options */
  getAdminReturnFilters() {
    return this.http.get(
      `${this.baseURL}/admin/returns/filters`,
      this.appendToken()
    );
  }

  /* 7. Get Returns List (Trailing Slash) */
  getAdminReturnsList() {
    return this.http.get(
      `${this.baseURL}/admin/returns/`,
      this.appendToken()
    );
  }

  /* 8. Get Returns Associated with a Specific Order */
  getAdminOrderReturns(
    orderId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get(
      `${this.baseURL}/admin/orders/${encodeURIComponent(orderId)}/returns`,
      {
        ...this.appendToken(),
        params,
      }
    );
  }

  /* 9. Update Return Status - Approve (Alternative Request) */
  updateAdminReturnApproval(returnId: string) {
    return this.http.patch(
      `${this.baseURL}/admin/returns/${encodeURIComponent(returnId)}/status`,
      {
        status: 'approved',
        message: 'Approved',
      },
      this.appendToken()
    );
  }

  /* 10. Update Return Status - Refunded */
  markAdminReturnAsRefunded(
    returnId: string,
    data: {
      refundMethod: string;
      refundReference: string;
      refundAmount: number;
      refundProcessedAt: string;
      refundNotes: string;
    }
  ) {
    return this.http.patch(
      `${this.baseURL}/admin/returns/${encodeURIComponent(returnId)}/status`,
      {
        status: 'refunded',
        ...data,
      },
      this.appendToken()
    );
  }

  /* 11. Update Return Status - Completed */
  completeAdminReturn(
    returnId: string,
    data: {
      refundMethod: string;
      refundReference: string;
      refundAmount: number;
      refundProcessedAt: string;
      refundNotes: string;
    }
  ) {
    return this.http.patch(
      `${this.baseURL}/admin/returns/${encodeURIComponent(returnId)}/status`,
      {
        status: 'completed',
        ...data,
      },
      this.appendToken()
    );
  }


  // Inventory Management APIs

  getAdminInventory(
    search?: string,
    status?: string,
    active?: string,
    sort?: string,
    page?: number,
    limit?: number
  ) {
    let params = new HttpParams();

    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (active) params = params.set('active', active);
    if (sort) params = params.set('sort', sort);
    if (page !== undefined) params = params.set('page', page);
    if (limit !== undefined) params = params.set('limit', limit);

    return this.http.get(`${this.baseURL}/admin/inventory`, {
      ...this.appendToken(),
      params,
    });
  }

  getAdminInventorySummary() {
    return this.http.get(`${this.baseURL}/admin/inventory/summary`, {
      ...this.appendToken(),
    });
  }

  getAdminInventoryFilters() {
    return this.http.get(`${this.baseURL}/admin/inventory/filters`, {
      ...this.appendToken(),
    });
  }

  getAdminInventoryReservations(
    page?: number,
    limit?: number,
    productId?: string
  ) {
    let params = new HttpParams();

    if (page !== undefined) params = params.set('page', page);
    if (limit !== undefined) params = params.set('limit', limit);
    if (productId) params = params.set('productId', productId);

    return this.http.get(`${this.baseURL}/admin/inventory/reservations`, {
      ...this.appendToken(),
      params,
    });
  }

  getAdminInventoryById(productId: string) {
    return this.http.get(
      `${this.baseURL}/admin/inventory/${encodeURIComponent(productId)}`,
      {
        ...this.appendToken(),
      }
    );
  }

  getAdminInventoryMovements(
    productId: string,
    movementType?: string,
    from?: string,
    to?: string,
    page?: number,
    limit?: number
  ) {
    let params = new HttpParams();

    if (movementType) params = params.set('movementType', movementType);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (page !== undefined) params = params.set('page', page);
    if (limit !== undefined) params = params.set('limit', limit);

    return this.http.get(
      `${this.baseURL}/admin/inventory/${encodeURIComponent(productId)}/movements`,
      {
        ...this.appendToken(),
        params,
      }
    );
  }

  adjustAdminInventory(
    productId: string,
    data: {
      direction: 'increase' | 'decrease';
      quantity: number;
      reason: string;
      note?: string;
      referenceType?: string;
      referenceId?: string;
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/inventory/${encodeURIComponent(productId)}/adjust`,
      data,
      {
        ...this.appendToken(),
      }
    );
  }

  restockAdminInventory(
    productId: string,
    data: {
      quantity: number;
      reason: string;
      note?: string;
      supplierName?: string;
      supplierInvoiceNumber?: string;
      unitCost?: number;
      receivedAt?: string;
      referenceId?: string;
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/inventory/${encodeURIComponent(productId)}/restock`,
      data,
      {
        ...this.appendToken(),
      }
    );
  }

  damageAdminInventory(
    productId: string,
    data: {
      quantity: number;
      reason: string;
      note?: string;
      referenceId?: string;
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/inventory/${encodeURIComponent(productId)}/damage`,
      data,
      {
        ...this.appendToken(),
      }
    );
  }

  returnAdminInventory(
    productId: string,
    data: {
      quantity: number;
      reason: string;
      note?: string;
      returnId?: string;
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/inventory/${encodeURIComponent(productId)}/return`,
      data,
      {
        ...this.appendToken(),
      }
    );
  }

  reconcileAdminInventory(
    productId: string,
    data: {
      physicalQuantity: number;
      reason: string;
      note?: string;
    }
  ) {
    return this.http.post(
      `${this.baseURL}/admin/inventory/${encodeURIComponent(productId)}/reconcile`,
      data,
      {
        ...this.appendToken(),
      }
    );
  }

  // Profile

  getProfile() {
    return this.http.get(`${this.baseURL}/profile`, {
      ...this.appendToken(),
    });
  }

  updateProfile(
    data: {
      currentPassword: string;
      name: string;
      email: string;
      mobile: string;
    }
  ) {
    return this.http.patch(`${this.baseURL}/profile`, data, {
      ...this.appendToken(),
    });
  }

  changeProfilePassword(
    data: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }
  ) {
    return this.http.patch(`${this.baseURL}/profile/password`, data, {
      ...this.appendToken(),
    });
  }


  /* 1. Get All Notifications */
  getNotifications(
    status: string = 'all',
    page: number = 1,
    limit: number = 20
  ) {
    const params = new HttpParams()
      .set('status', status)
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get(
      `${this.baseURL}/notifications`,
      {
        ...this.appendToken(),
        params,
      }
    );
  }

  /* 2. Get Unread Notifications Count */
  getUnreadNotificationCount() {
    return this.http.get(
      `${this.baseURL}/notifications/unread-count`,
      this.appendToken()
    );
  }

  /* 3. Mark a Notification as Read */
  markNotificationAsRead(notificationId: string) {
    return this.http.patch(
      `${this.baseURL}/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
      this.appendToken()
    );
  }

  /* 4. Mark All Notifications as Read */
  markAllNotificationsAsRead() {
    return this.http.patch(
      `${this.baseURL}/notifications/read-all`,
      {},
      this.appendToken()
    );
  }

  /* 5. Delete a Notification */
  deleteNotification(notificationId: string) {
    return this.http.delete(
      `${this.baseURL}/notifications/${encodeURIComponent(notificationId)}`,
      this.appendToken()
    );
  }

  /* 6. Delete All Read Notifications */
  deleteReadNotifications() {
    return this.http.delete(
      `${this.baseURL}/notifications/read`,
      this.appendToken()
    );
  }


  // Chronicles of Thread
  // Chronicles of Thread

  /* 1. Get Chronicles of Thread */
  getChroniclesOfThreadAPI() {
    return this.http.get(
      `${this.baseURL}/home-content/chronicles-of-thread`,
      this.appendToken()
    );
  }

  /* 2. Add Chronicles of Thread */
  addChroniclesOfThreadAPI(formData: FormData) {
    return this.http.post(
      `${this.baseURL}/home-content/chronicles-of-thread`,
      formData,
      this.appendToken()
    );
  }

  /* 3. Update Chronicles of Thread */
  updateChroniclesOfThreadAPI(formData: FormData) {
    return this.http.patch(
      `${this.baseURL}/home-content/chronicles-of-thread`,
      formData,
      this.appendToken()
    );
  }

  /* 4. Delete Chronicles of Thread */
  deleteChroniclesOfThreadAPI() {
    return this.http.delete(
      `${this.baseURL}/home-content/chronicles-of-thread`,
      this.appendToken()
    );
  }





  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
