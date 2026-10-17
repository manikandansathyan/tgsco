import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeritageHero } from './heritage-hero';

describe('HeritageHero', () => {
  let component: HeritageHero;
  let fixture: ComponentFixture<HeritageHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeritageHero],
    }).compileComponents();

    fixture = TestBed.createComponent(HeritageHero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
