import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddnewEdit } from './addnew-edit';

describe('AddnewEdit', () => {
  let component: AddnewEdit;
  let fixture: ComponentFixture<AddnewEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddnewEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddnewEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
