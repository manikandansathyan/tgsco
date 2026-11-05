import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsRefundsDetails } from './returns-refunds-details';

describe('ReturnsRefundsDetails', () => {
  let component: ReturnsRefundsDetails;
  let fixture: ComponentFixture<ReturnsRefundsDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnsRefundsDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnsRefundsDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
