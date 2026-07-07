import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessPlansAdd } from './business-plans-add';

describe('BusinessPlansAdd', () => {
  let component: BusinessPlansAdd;
  let fixture: ComponentFixture<BusinessPlansAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessPlansAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessPlansAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
