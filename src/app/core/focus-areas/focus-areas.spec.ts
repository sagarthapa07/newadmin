import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusAreaComponent } from './focus-areas';

describe('FocusAreaComponent', () => {
  let component: FocusAreaComponent;
  let fixture: ComponentFixture<FocusAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FocusAreaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FocusAreaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
