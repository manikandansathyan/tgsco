import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HonouredForHeritage } from './honoured-for-heritage';

describe('HonouredForHeritage', () => {
  let component: HonouredForHeritage;
  let fixture: ComponentFixture<HonouredForHeritage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HonouredForHeritage],
    }).compileComponents();

    fixture = TestBed.createComponent(HonouredForHeritage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
