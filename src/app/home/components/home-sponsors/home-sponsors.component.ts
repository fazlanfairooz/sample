import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SponsorModel, FloorModel, SponsorSearchModel } from '../../../core/virtual-events/models/sponsor.model';
import { Store } from '@ngrx/store';
import { EventsState } from '../../../core/reducers';
import { DataLoaderService } from '../../../shared/services/data-loader.service';
import { takeUntil, tap, filter } from 'rxjs/operators';
import { combineLatest, Observable, BehaviorSubject } from 'rxjs';
import { selectEventData, selectEventLabels } from 'src/app/core/virtual-events/selectors/app.selectors';
import { selectCurrentUser } from 'src/app/core/auth/selectors/auth.selector';
import { Unsubscriber } from '../../../shared/classes/unsubscriber.class';
import { EventDataModel } from '../../../core/virtual-events';
import { isDefined } from '../../../shared/utils/helper-fns';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { BaseComponent } from 'src/app/core/components/base/base.component';

@Component({
  selector: 'home-sponsors',
  templateUrl: './home-sponsors.component.html',
  styleUrls: ['./home-sponsors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeSponsorsComponent extends BaseComponent implements OnInit {
  @Input() label = '';
  @Input() description = '';
  @Input() record = 12;
  @Input() recordPerRow = 4;
  @Input() settings: any;

  sponsorJson: SponsorModel[];
  eleCount: string;
  eventName: any;
  userId: number;
  eventData: EventDataModel;
  eventData$ = new BehaviorSubject<EventDataModel>(null);
  eventLabels: { key: string, value: string }[];

  constructor(
    store: Store<EventsState>,
    route: ActivatedRoute,
    router : Router,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private dataLoader: DataLoaderService,
  ) {
    super(store, route,router, localStorage);
  }

  ngOnInit() {

    combineLatest(this.store.select(selectEventData), this.store.select(selectCurrentUser), this.store.select(selectEventLabels))
      .pipe(filter(f => Boolean(f[0])), tap(([eventData, currentUser, labels]) => {
        this.eventData = eventData;
        this.eventData$.next(this.eventData);
        this.eventName = eventData.eventUrlName;
        this.eventName = eventData.eventUrlName;
        this.userId = currentUser?.userId;

        this.eventLabels = labels as { key: string, value: string }[];
      }), takeUntil(this.unsubscribe)).subscribe();

    if (this.record == 0 || this.record == undefined) {
      this.record = 18;
    }

    this.eventData$.pipe(filter(f => !!f), tap(s => {
      var model = new SponsorSearchModel(true, s.conferenceId, 1, this.record, [], undefined);
      this.loadSponsor(model);
    }), takeUntil(this.unsubscribe)).subscribe();

  }

  loadSponsor(model: SponsorSearchModel): void {
    this.dataLoader
      .loadSponsorData(model, this.unsubscribe)
      .subscribe((res) => {
          this.sponsorJson = (res as unknown as { floor: FloorModel, sponsors: SponsorModel[] }).sponsors || [];
        this.cdr.markForCheck();

      });
  }

  getSponsors(type: string) {
    return this.sponsorJson.filter(x => x.typeName === type);
  }

  getSponsor(sponsor: SponsorModel) {
    if (sponsor.enableBooth) {
      if (!this.userId) {
        const url = `${this.eventData.eventUrlName}/auth`;
        this.router.navigateByUrl(url);
      }
      else {
        this.router.navigate([`/${this.eventName}/expohall/booths/${sponsor.name}`]);
        //this.router.navigateByUrl(`/${this.eventData.eventUrlName}/expohall/booths/${sponsor.name}`);
      }
    }
  }

  seeallSponsor() {
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/expohall`);
  }

  closeSection(name) {
    const myTag = document.getElementById(name);
    if (myTag.classList.contains('show')) {
      myTag.classList.remove('show');
    }
  }

  getClass(index) {
    if (index == 0) {
      return 'offset-md-1';
    }
  }

  getClassimg(name) {
    if (name == 'Electronic Arts' || name == 'LinkedIn' || name == 'Apple') {
      return 'super';
    }
  }

  get hasMore() {
    if (!this.sponsorJson)
      return false;

    return this.sponsorJson.length > 0 ? true : false;
  }
  get loadMoreSponsor() {
    if (this.settings?.loadmoresponsors === undefined || this.settings?.loadmoresponsors === true) {
      return true;
    }

    return false;
  }

}
