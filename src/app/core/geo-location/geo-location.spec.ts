import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoLocation } from './geo-location';

describe('GeoLocation', () => {
  let component: GeoLocation;
  let fixture: ComponentFixture<GeoLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeoLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeoLocation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
