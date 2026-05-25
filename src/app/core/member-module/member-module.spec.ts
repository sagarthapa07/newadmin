import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberModule } from './member-module';

describe('MemberModule', () => {
  let component: MemberModule;
  let fixture: ComponentFixture<MemberModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
