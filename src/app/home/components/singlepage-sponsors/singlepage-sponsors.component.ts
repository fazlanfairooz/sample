import { Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { EventsState } from 'src/app/core/reducers';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { SponsorModel, SponsorSearchModel, FloorModel } from '../../../core/virtual-events/models/sponsor.model';
import { BaseComponent } from '../../../core/components/base/base.component';
import { DataLoaderService } from '../../../shared/services/data-loader.service';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';
import { takeUntil, filter, tap } from 'rxjs/operators';

@Component({
  selector: 'de-singlepage-sponsors',
  templateUrl: './singlepage-sponsors.component.html',
  styleUrls: ['./singlepage-sponsors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SinglepageSponsorsComponent extends BaseComponent implements OnInit {
  @Input() label = '';
  sponsorJson: SponsorModel[];
  eleCount: string;

  constructor(
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    localStorage: LocalStorageService,
    private dataLoader: DataLoaderService,
    private cdr: ChangeDetectorRef,
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit() {
    super.ngOnInit();
    this.eventData$.pipe(filter(f => !!f), tap(s => {
      var model = new SponsorSearchModel(true, s.conferenceId, 1, 50, [], undefined);
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

  getSponsor(name) {
    this.eleCount = name;
  }
  seeallSponsor() {
    this.router.navigate([`/${this.confereceUrlName}/expohall`]);
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

}
