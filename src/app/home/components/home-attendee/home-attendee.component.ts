import { Component, ChangeDetectionStrategy, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { BaseComponent } from '../../../core/components/base/base.component';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeService } from '../../../core/virtual-events/services/home.service';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { EventsState } from '../../../core/reducers';
import { Store } from '@ngrx/store';
import { AttendeeDirectoryModel } from '../../../core/virtual-events/models/attendee-directory.model';
import { Guid } from 'guid-typescript';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'home-attendee',
  templateUrl: './home-attendee.component.html',
  styleUrls: ['./home-attendee.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeAttendeeComponent extends BaseComponent implements OnInit {
  @Input() label = '';
  attendee: AttendeeDirectoryModel[] = [];
  pageNo = 1;
  pageSize = 20;
  searchText = '';
  conferenceId: number;

  carousalOptions: OwlOptions = {
    items: 4,
    center: false,
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    navSpeed: 500,
    nav: false,
    navText: [
      '<i title="Previous" class="fa fa-chevron-left"></i>',
      '<i title="Next" class="fa fa-chevron-right"></i>'
    ]
  };

  constructor(
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    private homeService: HomeService,
    private spinner: NgxSpinnerService,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef) {
    super(store, route, router, localStorage);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.loadHomeAttendee();
    this.conferenceId = this.eventData.conferenceId;
  }

  loadHomeAttendee() {
    const spinnerId = Guid.create().toString();
    this.store.dispatch(new ShowSpinnerAction({ name: spinnerId }));

    this.homeService
      .getAttendeeData(this.conferenceId, this.userId, 3, this.pageNo, this.pageSize, this.searchText)
      .pipe(finalize(() => this.store.dispatch(new HideSpinnerAction({ name: spinnerId }))))
      .subscribe(r => {
        if (this.isSuccess(r)) {
          this.attendee = r.entity;
          this.cdr.markForCheck();
        }
      });
  }
}
