import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateTechniques } from './state-techniques';

describe('StateTechniques', () => {
  let component: StateTechniques;
  let fixture: ComponentFixture<StateTechniques>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StateTechniques],
    }).compileComponents();

    fixture = TestBed.createComponent(StateTechniques);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
