
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucidePackage,
  LucideUsers,
  LucideNewspaper,
  LucideImage,
  LucideArrowUpRight,
  LucideArrowRight,
  LucidePlus,
  LucideFileText,
  LucideCalendarDays,
  LucideClock,
  LucideCheckCircle,
  LucideActivity,
  LucideEye,
  LucidePencil,
  LucideExternalLink,
} from '@lucide/angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucidePackage,
    LucideUsers,
    LucideNewspaper,
    LucideImage,
    LucideArrowUpRight,
    LucideArrowRight,
    LucideFileText,
    LucideCalendarDays,
    LucideClock,
    LucideCheckCircle,
    LucideActivity,
    LucideExternalLink,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly summaryCards = [
    {
      title: 'Total Products',
      value: '128',
      description: 'Products in catalogue',
      icon: LucidePackage,
      color: 'burgundy',
      route: '/products',
    },
    {
      title: 'Artisans & Makers',
      value: '36',
      description: 'Artisans featured',
      icon: LucideUsers,
      color: 'green',
      route: '/makers',
    },
    {
      title: 'Published Content',
      value: '24',
      description: 'Blogs and news articles',
      icon: LucideNewspaper,
      color: 'blue',
      route: '/news',
    },
    {
      title: 'Media Assets',
      value: '86',
      description: 'Images and other assets',
      icon: LucideImage,
      color: 'amber',
      route: '/media',
    },
  ];

  readonly activityData = [
    { day: 'Mon', blogs: 0, news: 0 },
    { day: 'Tue', blogs: 6, news: 0 },
    { day: 'Wed', blogs: 0, news: 0 },
    { day: 'Thu', blogs: 0, news: 0 },
    { day: 'Fri', blogs: 0, news: 0 },
    { day: 'Sat', blogs: 0, news: 0 },
    { day: 'Sun', blogs: 0, news: 0 },
  ];

  readonly recentUpdates = [
    {
      title: 'Traditional Handloom Collection',
      category: 'Featured Collections',
      date: 'Today, 10:30 AM',
      status: 'Published',
      type: 'collection',
      route: '/home/featured-collections',
    },
    {
      title: 'Meet the Weavers of Kerala',
      category: 'Blog',
      date: 'Today, 09:15 AM',
      status: 'Published',
      type: 'blog',
      route: '/home/blog',
    },
    {
      title: 'State Craft Exhibition 2026',
      category: 'News & Events',
      date: 'Yesterday, 04:20 PM',
      status: 'Draft',
      type: 'news',
      route: '/home/news-events',
    },
    {
      title: 'Our Journey of Weaving',
      category: 'Homepage Content',
      date: 'Yesterday, 02:45 PM',
      status: 'Published',
      type: 'page',
      route: '/home/journey-of-weave',
    },
  ];

  readonly quickActions = [
    {
      title: 'Add Product',
      description: 'Add a product to the catalogue',
      icon: LucidePackage,
      route: '/products',
    },
    {
      title: 'Write a Blog',
      description: 'Create a new blog article',
      icon: LucideFileText,
      route: '/home/blog',
    },
    {
      title: 'Add a Maker',
      description: 'Feature an artisan or weaver',
      icon: LucideUsers,
      route: '/makers',
    },
    {
      title: 'Upload Media',
      description: 'Manage images and assets',
      icon: LucideImage,
      route: '/media',
    },
  ];

  get todayLabel(): string {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  get maxActivity(): number {
    return Math.max(
      ...this.activityData.map((item) => item.blogs + item.news),
      1,
    );
  }

  barHeight(value: number): number {
    return Math.max((value / this.maxActivity) * 100, 5);
  }

  get activityTotal(): number {
    return this.activityData.reduce(
      (total, item) => total + item.blogs + item.news,
      0,
    );
  }
}
