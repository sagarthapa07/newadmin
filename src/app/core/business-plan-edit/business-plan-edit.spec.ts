import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessPlanEdit } from './business-plan-edit';

describe('BusinessPlanEdit', () => {
  let component: BusinessPlanEdit;
  let fixture: ComponentFixture<BusinessPlanEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPlanEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessPlanEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
