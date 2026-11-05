import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chronicles } from './chronicles';

describe('Chronicles', () => {
  let component: Chronicles;
  let fixture: ComponentFixture<Chronicles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chronicles],
    }).compileComponents();

    fixture = TestBed.createComponent(Chronicles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
