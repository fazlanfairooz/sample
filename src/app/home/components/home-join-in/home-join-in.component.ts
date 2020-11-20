import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { EventsState } from '../../../core/reducers';
import { ToggleUserProfile } from '../../../core/virtual-events';

@Component({
  selector: 'home-join-in',
  templateUrl: './home-join-in.component.html',
  styleUrls: ['./home-join-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeJoinInComponent implements OnInit {

  constructor(private store: Store<EventsState>) {
  }

  ngOnInit() {

  }

  openProfile() {
    this.store.dispatch(new ToggleUserProfile({toggle: true}));
  }
}
