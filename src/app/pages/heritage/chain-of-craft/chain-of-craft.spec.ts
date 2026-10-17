import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChainOfCraft } from './chain-of-craft';

describe('ChainOfCraft', () => {
  let component: ChainOfCraft;
  let fixture: ComponentFixture<ChainOfCraft>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChainOfCraft],
    }).compileComponents();

    fixture = TestBed.createComponent(ChainOfCraft);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
