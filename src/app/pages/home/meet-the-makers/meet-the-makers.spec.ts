import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetTheMakers } from './meet-the-makers';

describe('MeetTheMakers', () => {
  let component: MeetTheMakers;
  let fixture: ComponentFixture<MeetTheMakers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetTheMakers],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetTheMakers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
