import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Unsubscriber } from 'src/app/shared/classes/unsubscriber.class';
import { Store } from '@ngrx/store';
import { EventDataModel, selectEventData } from '../../../core/virtual-events';
import { EventsState } from '../../../core/reducers';
import { tap, takeUntil } from 'rxjs/operators';


@Component({
  selector: 'home-event-when',
  templateUrl: './home-event-when.component.html',
  styleUrls: ['./home-event-when.component.scss'],
  // encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeEventWhenComponent extends Unsubscriber implements OnInit {
  eventDetails: EventDataModel;


  constructor(
    private store: Store<EventsState>) {
    super();
  }

  ngOnInit(): void {
    this.store
      .select(selectEventData)
      .pipe(
        tap(res => {
          if (res) {
            this.eventDetails = res;
          }
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }

  addToCalander() {
    var description = String(this.eventDetails.abstract)
    /*replace html markup */.replace(/<[\s\S]*?>/g, "");

    var icsMSG = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Our Company//NONSGML v1.0//EN\nBEGIN:VEVENT\nUID:me@google.com\nDTSTAMP:20120315T170000Z\nATTENDEE;\nDTSTART:" + this.eventDetails.startDate + "\nDTEND:" + this.eventDetails.endDate + "\nLOCATION:" + this.eventDetails.title + "\nSUMMARY:" + this.eventDetails.title + "\nDESCRIPTION:" + description + "\nEND:VEVENT\nEND:VCALENDAR";
    window.open("data:text/calendar;charset=utf8," + escape(icsMSG));
  }
}
