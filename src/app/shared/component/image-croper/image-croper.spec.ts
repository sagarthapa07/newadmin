import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCroper } from './image-croper';

describe('ImageCroper', () => {
  let component: ImageCroper;
  let fixture: ComponentFixture<ImageCroper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCroper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageCroper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
