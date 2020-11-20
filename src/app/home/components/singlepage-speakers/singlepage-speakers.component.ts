import { Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Store } from '@ngrx/store';
import { EventsState } from 'src/app/core/reducers';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from '../../../core/components/base/base.component';
import { SpeakerDetailModel } from '../../../core/virtual-events/models/session/speaker.model';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { EventService } from '../../../core/virtual-events/services/app.service';
import { DataLoaderService } from '../../../shared/services/data-loader.service';
import { takeUntil } from 'rxjs/operators';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';

@Component({
  selector: 'de-singlepage-speakers',
  templateUrl: './singlepage-speakers.component.html',
  styleUrls: ['./singlepage-speakers.component.scss'],
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

export class SinglepageSpeakersComponent extends BaseComponent implements OnInit {
  @Input() label: string = '';
  count = 1000;
  isOpened = false;
  selectedSpeaker: SpeakerDetailModel;
  speakerJson: SpeakerDetailModel[] = [];

  constructor(
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    localStorage: LocalStorageService,
    private appService: EventService,
    private cdr: ChangeDetectorRef,
    private dataLoader: DataLoaderService,
  ) {
    super(store, route, router, localStorage
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.loadSpeaker();
  }

  loadSpeaker(): void {
    this.dataLoader
      .loadSpeakersData(this.eventData.conferenceId, this.count, this.unsubscribe)
      .subscribe((speakerJson) => {
        this.speakerJson = speakerJson || [];

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
}
