import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GovtSchemes } from './govt-schemes';

describe('GovtSchemes', () => {
  let component: GovtSchemes;
  let fixture: ComponentFixture<GovtSchemes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovtSchemes],
    }).compileComponents();

    fixture = TestBed.createComponent(GovtSchemes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
