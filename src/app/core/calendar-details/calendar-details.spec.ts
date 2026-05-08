import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarDetails } from './calendar-details';

describe('CalendarDetails', () => {
  let component: CalendarDetails;
  let fixture: ComponentFixture<CalendarDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
