import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumbersThatTellAStory } from './numbers-that-tell-a-story';

describe('NumbersThatTellAStory', () => {
  let component: NumbersThatTellAStory;
  let fixture: ComponentFixture<NumbersThatTellAStory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumbersThatTellAStory],
    }).compileComponents();

    fixture = TestBed.createComponent(NumbersThatTellAStory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
