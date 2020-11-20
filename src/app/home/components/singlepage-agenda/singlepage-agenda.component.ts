import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { EventsState } from 'src/app/core/reducers';
import { takeUntil, tap, switchMap, map, filter, distinctUntilChanged } from 'rxjs/operators';
import * as _ from 'lodash';
import { SessionModel, IUserSessionPlan } from '../../../core/virtual-events/models/session/session.model';
import { BaseComponent } from '../../../core/components/base/base.component';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { currentUserId } from '../../../core/auth/selectors/auth.selector';
import { DataLoaderService } from '../../../shared/services/data-loader.service';
import { Observable } from 'rxjs';
import { selectSessions } from '../../../core/virtual-events/selectors/session.selectors';
import { ShowSpinnerAction, HideSpinnerAction } from '../../../core/virtual-events/actions/spinner.actions';

@Component({
  selector: 'de-singlepage-agenda',
  templateUrl: './singlepage-agenda.component.html',
  styleUrls: ['./singlepage-agenda.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinglepageAgendaComponent extends BaseComponent implements OnInit {
  sessions: SessionModel[] = [];
  userId = 0;
  userSessionPlans: IUserSessionPlan[] = [];

  constructor(
    route: ActivatedRoute,
    router: Router,
    store: Store<EventsState>,
    localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private dataLoader: DataLoaderService,
  ) {
    super(store, route, router, localStorage);
  }

  ngOnInit(): void {
    this.store
    .select(currentUserId)
    .pipe(
      tap(res => this.userId = res),
      takeUntil(this.unsubscribe)
    )
    .subscribe();
    this.loadSession();

    this.store.pipe(
      select(selectSessions(this.eventData.conferenceId)),
      filter(data => Boolean(data && this.userId)),
      map(entity => entity.map(m => m.session.sessionId)),
      filter(sessionIds => sessionIds.length > 0),
      distinctUntilChanged(_.isEqual),
      switchMap(sessionIds => this.getUserPlans(sessionIds)),
      takeUntil(this.unsubscribe),
    ).subscribe((userSessionPlans) => {
      this.userSessionPlans = userSessionPlans;
      this.cdr.markForCheck();
    });
  }

  loadSession(): void {
    this.dataLoader
      .loadSessions(this.eventData.conferenceId, this.unsubscribe)
      .subscribe(data => {
        if (data) {
          this.generateSessions(data);
        }
      });
  }

  getUserPlans(sessionIds: number[]): Observable<any> {
    return this.dataLoader
      .loadUserSessionPlans(
        this.eventData.conferenceId,
        this.userId,
        sessionIds,
        this.unsubscribe
      )
      .pipe(
        tap((userSessionPlans) => {
          if (userSessionPlans) {
            this.userSessionPlans = userSessionPlans || [];
            this.cdr.markForCheck();
          }
        }),
      );
  }

  generateSessions(entity: SessionModel[]): void {
    const data = [];

    entity.forEach(item => {
      const dataIndex = _.findIndex(data, d => (d.streamName == item.session.streamName));

      if (dataIndex > -1) {
        data[dataIndex].items.push(item);
      } else {
        data.push({
          streamName: item.session.streamName,
          items: [item]
        });
      }
    });

    this.sessions = data;
  }

  editSession(session) {

  }
}
