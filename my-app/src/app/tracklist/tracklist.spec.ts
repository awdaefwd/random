import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TracklistComponent } from './tracklist';

describe('Tracklist', () => {
  let component: TracklistComponent;
  let fixture: ComponentFixture<TracklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TracklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TracklistComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
