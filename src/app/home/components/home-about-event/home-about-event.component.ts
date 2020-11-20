import { Component, ChangeDetectionStrategy, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { EventsState } from 'src/app/core/reducers';
import { tap, takeUntil } from 'rxjs/operators';
import { Unsubscriber } from '../../../shared/classes/unsubscriber.class';
import { EventDataModel, selectEventData } from '../../../core/virtual-events';

@Component({
  selector: 'home-about-event',
  templateUrl: './home-about-event.component.html',
  styleUrls: ['./home-about-event.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeAboutEventComponent extends Unsubscriber implements OnInit {

  @Input() label = '';
  eventDetails: EventDataModel;

  constructor(private store: Store<EventsState>, private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this.store
      .select(selectEventData)
      .pipe(
        tap(res => {
          if (res) {
            this.eventDetails = res;
            this.cdr.markForCheck();
          }
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }
}
