import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoSocial } from './seo-social';

describe('SeoSocial', () => {
  let component: SeoSocial;
  let fixture: ComponentFixture<SeoSocial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoSocial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoSocial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
