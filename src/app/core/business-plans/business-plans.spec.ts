import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessPlans } from './business-plans';

describe('BusinessPlans', () => {
  let component: BusinessPlans;
  let fixture: ComponentFixture<BusinessPlans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPlans]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessPlans);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
