import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PandingGrants } from './panding-grants';

describe('PandingGrants', () => {
  let component: PandingGrants;
  let fixture: ComponentFixture<PandingGrants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PandingGrants]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PandingGrants);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
