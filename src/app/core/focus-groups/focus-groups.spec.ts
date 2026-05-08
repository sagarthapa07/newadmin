import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FocusGroupsComponent } from "./focus-groups";

describe("FocusGroupsComponent", () => {
  let component: FocusGroupsComponent;
  let fixture: ComponentFixture<FocusGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FocusGroupsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FocusGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
