import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GovernmentInitiatives } from './government-initiatives';

describe('GovernmentInitiatives', () => {
  let component: GovernmentInitiatives;
  let fixture: ComponentFixture<GovernmentInitiatives>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovernmentInitiatives],
    }).compileComponents();

    fixture = TestBed.createComponent(GovernmentInitiatives);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
