import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogueDetail } from './catalogue-detail';

describe('CatalogueDetail', () => {
  let component: CatalogueDetail;
  let fixture: ComponentFixture<CatalogueDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogueDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogueDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
