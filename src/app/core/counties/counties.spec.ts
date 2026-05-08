import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountiesComponent } from './counties';

describe('CountiesComponent', () => {
  let component: CountiesComponent;
  let fixture: ComponentFixture<CountiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CountiesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
