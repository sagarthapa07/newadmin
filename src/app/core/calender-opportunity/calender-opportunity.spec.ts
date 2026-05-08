import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalenderOpportunity } from './calender-opportunity';

describe('CalenderOpportunity', () => {
  let component: CalenderOpportunity;
  let fixture: ComponentFixture<CalenderOpportunity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalenderOpportunity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalenderOpportunity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
