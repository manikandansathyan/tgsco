import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeopleGuidingOurMission } from './people-guiding-our-mission';

describe('PeopleGuidingOurMission', () => {
  let component: PeopleGuidingOurMission;
  let fixture: ComponentFixture<PeopleGuidingOurMission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeopleGuidingOurMission],
    }).compileComponents();

    fixture = TestBed.createComponent(PeopleGuidingOurMission);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
