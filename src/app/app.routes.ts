import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/layout/admin-layout/admin-layout').then(
        (m) => m.AdminLayout,
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },

      {
        path: 'home',
        children: [
          {
            path: '',
            redirectTo: 'hero',
            pathMatch: 'full',
          },
          {
            path: 'hero',
            loadComponent: () =>
              import('./pages/home/hero/hero').then((m) => m.Hero),
          },
          {
            path: 'story',
            loadComponent: () =>
              import('./pages/home/story/story').then((m) => m.Story),
          },
          {
            path: 'state-techniques',
            loadComponent: () =>
              import('./pages/home/state-techniques/state-techniques').then(
                (m) => m.StateTechniques,
              ),
          },
          {
            path: 'journey-of-weave',
            loadComponent: () =>
              import('./pages/home/journey-of-weave/journey-of-weave').then(
                (m) => m.JourneyOfWeave,
              ),
          },
          {
            path: 'meet-the-makers',
            loadComponent: () =>
              import('./pages/home/meet-the-makers/meet-the-makers').then(
                (m) => m.MeetTheMakers,
              ),
          },
          {
            path: 'why-choose-us',
            loadComponent: () =>
              import('./pages/home/why-choose-us/why-choose-us').then(
                (m) => m.WhyChooseUs,
              ),
          },
          {
            path: 'featured-collections',
            loadComponent: () =>
              import(
                './pages/home/featured-collections/featured-collections'
              ).then((m) => m.FeaturedCollections),
          },
          {
            path: 'government-initiatives',
            loadComponent: () =>
              import(
                './pages/home/government-initiatives/government-initiatives'
              ).then((m) => m.GovernmentInitiatives),
          },
          {
            path: 'blog',
            loadComponent: () =>
              import('./pages/home/blog/blog').then((m) => m.Blog),
          },
          {
            path: 'news-events',
            loadComponent: () =>
              import('./pages/home/news-events/news-events').then(
                (m) => m.NewsEvents,
              ),
          },
          {
            path: 'footer',
            loadComponent: () =>
              import('./pages/home/footer/footer').then((m) => m.Footer),
          },
        ],
      },

      {
        path: 'about',
        children: [
          {
            path: '',
            redirectTo: 'hero',
            pathMatch: 'full',
          },
          {
            path: 'hero',
            loadComponent: () =>
              import('./pages/about/hero/hero').then((m) => m.Hero),
          },
          {
            path: 'story',
            loadComponent: () =>
              import('./pages/about/story/story').then((m) => m.Story),
          },
          {
            path: 'milestones',
            loadComponent: () =>
              import('./pages/about/milestones/milestones').then(
                (m) => m.Milestones,
              ),
          },
          {
            path: 'vision',
            redirectTo: 'vision',
            pathMatch: 'full',
          },
          {
            path: 'vision',
            loadComponent: () =>
              import('./pages/about/vision/vision').then((m) => m.Vision),
          },
          {
            path: 'mission',
            loadComponent: () =>
              import('./pages/about/mission/mission').then((m) => m.Mission),
          },
          {
            path: 'purpose',
            loadComponent: () =>
              import('./pages/about/purpose/purpose').then((m) => m.Purpose),
          },
        ],
      },

      {
        path: 'scheme',
        children: [
          {
            path: '',
            redirectTo: 'schemes',
            pathMatch: 'full',
          },
          {
            path: 'schemes',
            loadComponent: () =>
              import('./pages/scheme/schemes/schemes').then((m) => m.Schemes),
          },
          {
            path: 'support',
            loadComponent: () =>
              import('./pages/scheme/support/support').then((m) => m.Support),
          },
          {
            path: 'govt-schemes',
            loadComponent: () =>
              import('./pages/scheme/govt-schemes/govt-schemes').then(
                (m) => m.GovtSchemes,
              ),
          },
        ],
      },

      {
        path: 'heritage',
        children: [
          {
            path: '',
            redirectTo: 'hero',
            pathMatch: 'full',
          },
          {
            path: 'hero',
            loadComponent: () =>
              import('./pages/heritage/heritage-hero/heritage-hero').then(
                (m) => m.HeritageHero
              ),
          },
          {
            path: 'chain-of-craft',
            loadComponent: () =>
              import('./pages/heritage/chain-of-craft/chain-of-craft').then(
                (m) => m.ChainOfCraft
              ),
          },
          {
            path: 'numbers-that-tell-a-story',
            loadComponent: () =>
              import(
                './pages/heritage/numbers-that-tell-a-story/numbers-that-tell-a-story'
              ).then((m) => m.NumbersThatTellAStory),
          },
          {
            path: 'sustainability',
            loadComponent: () =>
              import('./pages/heritage/sustainability/sustainability').then(
                (m) => m.Sustainability
              ),
          },
          {
            path: 'people-guiding-our-mission',
            loadComponent: () =>
              import(
                './pages/heritage/people-guiding-our-mission/people-guiding-our-mission'
              ).then((m) => m.PeopleGuidingOurMission),
          },
          {
            path: 'honoured-for-heritage',
            loadComponent: () =>
              import(
                './pages/heritage/honoured-for-heritage/honoured-for-heritage'
              ).then((m) => m.HonouredForHeritage),
          },
        ],
      },

      {
        path: 'news-and-events',
        children: [
          {
            path: '',
            redirectTo: 'hero',
            pathMatch: 'full',
          },
          {
            path: 'calender',
            loadComponent: () =>
              import(
                './pages/news-and-events/calender/calender'
              ).then((m) => m.Calender),
          },
          {
            path: 'exhibitions',
            loadComponent: () =>
              import(
                './pages/news-and-events/exhibitions/exhibitions'
              ).then((m) => m.Exhibitions),
          },
          {
            path: 'hero',
            loadComponent: () =>
              import(
                './pages/news-and-events/hero/hero'
              ).then((m) => m.Hero),
          },
          {
            path: 'latest-news',
            loadComponent: () =>
              import(
                './pages/news-and-events/latest-news/latest-news'
              ).then((m) => m.LatestNews),
          },
          {
            path: 'media',
            loadComponent: () =>
              import(
                './pages/news-and-events/media/media'
              ).then((m) => m.Media),
          },
          {
            path: 'press',
            loadComponent: () =>
              import(
                './pages/news-and-events/press/press'
              ).then((m) => m.Press),
          },
          {
            path: 'threads',
            loadComponent: () =>
              import(
                './pages/news-and-events/threads/threads'
              ).then((m) => m.Threads),
          },
        ],
      },

      {
        path: 'contact',
        children: [
          {
            path: '',
            redirectTo: 'contact-hero',
            pathMatch: 'full',
          },
          {
            path: 'contact-hero',
            loadComponent: () =>
              import('./pages/conatct/contact-hero/contact-hero')
                .then((m) => m.ContactHero),
          },
          {
            path: 'contact-inquiries',
            loadComponent: () =>
              import('./pages/conatct/contact-inquiries/contact-inquiries')
                .then((m) => m.ContactInquiries),
          },
          {
            path: 'faq',
            loadComponent: () =>
              import('./pages/conatct/faq/faq')
                .then((m) => m.Faq),
          },
          {
            path: 'map',
            loadComponent: () =>
              import('./pages/conatct/map/map')
                .then((m) => m.Map),
          },
          {
            path: 'message',
            loadComponent: () =>
              import('./pages/conatct/message/message')
                .then((m) => m.Message),
          },
        ],
      },

      {
        path: 'video',
        loadComponent: () =>
          import('./pages/vides/video/video').then((m) => m.Video),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
