import { Component, ChangeDetectionStrategy, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { BaseComponent } from '../../../core/components/base/base.component';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/virtual-events/services/app.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Store } from '@ngrx/store';
import { EventsState } from '../../../core/reducers';
import { SpeakerDetailModel } from '../../../core/virtual-events/models/session/speaker.model';
import { DataLoaderService } from '../../../shared/services/data-loader.service';
import { selectEventData, selectEventLabels } from 'src/app/core/virtual-events/selectors/app.selectors';
import { takeUntil, filter } from 'rxjs/operators';
import { isDefined } from '@angular/compiler/src/util';
import { AppConstants } from 'src/app/core/constants/app.constants';

@Component({
  selector: 'home-speakers',
  templateUrl: './home-speakers.component.html',
  styleUrls: ['./home-speakers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('panelInOut', [
      transition('void => *', [
        style({ transform: 'translateX(-100%)' }),
        animate(500)
      ]),
      transition('* => void', [
        animate(500, style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ]
})

export class HomeSpeakersComponent extends BaseComponent implements OnInit {
  @Input() label = '';
  @Input() record = 6;
  @Input() recordPerRow = 3;
  @Input() description = '';
  isOpened = false;
  selectedSpeaker: SpeakerDetailModel = new SpeakerDetailModel();
  speakerJson: SpeakerDetailModel[] = [];
  drawyerspeakerJson: SpeakerDetailModel[] = [];
  eventName: any;
  eventLabels: { key: string; value: string; }[];

  constructor(
    store: Store<EventsState>,
    route: ActivatedRoute,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private dataLoader: DataLoaderService,
    router: Router,
    private appService: EventService,
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit(): void {
    this.store.select(selectEventData)
      .pipe(filter(f => isDefined(f)), takeUntil(this.unsubscribe))
      .subscribe(data => {
        if (data) {
          this.eventName = data.eventUrlName;
          this.cdr.markForCheck();
        }
      });

    this.store.select(selectEventLabels).pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.eventLabels = res as { key: string, value: string }[];
        }
        this.cdr.markForCheck();
      });

    super.ngOnInit();
    if(!this.record){
      this.record = 6;
    }
    this.loadSpeaker();
  }

  loadSpeaker(): void {
    this.dataLoader.loadSpeakersData(
      this.eventData.conferenceId,
      this.record || 6,
      this.unsubscribe,
    )
      .subscribe((speakerJson) => {
        this.speakerJson = speakerJson;
        this.speakerJson.forEach((element, index) => {
          if (index + 1 <= (this.record || 1000)) {
            this.drawyerspeakerJson.push(element);
          }
        });
        this.cdr.markForCheck();
      });
  }

  showDetail(data: SpeakerDetailModel) {
    this.isOpened = true;
    this.selectedSpeaker = data;
  }

  redirectToPages(page: string) {
    this.router.navigateByUrl(`/${this.eventData.eventUrlName}/${page}`);
  }

  get hasMore() {
    if (!this.speakerJson)
      return false;

    return this.speakerJson.length > 0 ? true : false;
  }

  clearSpeaker() {
    this.selectedSpeaker = new SpeakerDetailModel();
  }

}
