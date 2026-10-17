import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Threads } from './threads';

describe('Threads', () => {
  let component: Threads;
  let fixture: ComponentFixture<Threads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Threads],
    }).compileComponents();

    fixture = TestBed.createComponent(Threads);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
