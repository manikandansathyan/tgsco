import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnsRefunds } from './returns-refunds';

describe('ReturnsRefunds', () => {
  let component: ReturnsRefunds;
  let fixture: ComponentFixture<ReturnsRefunds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnsRefunds],
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnsRefunds);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
