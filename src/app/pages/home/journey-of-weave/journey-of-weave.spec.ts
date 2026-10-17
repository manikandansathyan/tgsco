import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JourneyOfWeave } from './journey-of-weave';

describe('JourneyOfWeave', () => {
  let component: JourneyOfWeave;
  let fixture: ComponentFixture<JourneyOfWeave>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyOfWeave],
    }).compileComponents();

    fixture = TestBed.createComponent(JourneyOfWeave);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
