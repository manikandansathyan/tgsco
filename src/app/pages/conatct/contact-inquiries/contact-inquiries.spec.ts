import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactInquiries } from './contact-inquiries';

describe('ContactInquiries', () => {
  let component: ContactInquiries;
  let fixture: ComponentFixture<ContactInquiries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactInquiries],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactInquiries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
