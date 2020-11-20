import { Component, OnInit, ChangeDetectionStrategy, AfterContentInit, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { EventsState } from '../../../core/reducers';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { LoaderService } from '../../../core/virtual-events/services/loader.service';
import { PlaylistService } from '../../../shared/services/playlist.service';
import { PlaylistCommonComponent } from '../../../shared/components/playlist-common/playlist-common.component';

@Component({
  selector: 'home-playlist',
  templateUrl: './home-playlist.component.html',
  styleUrls: ['./home-playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePlaylistComponent extends PlaylistCommonComponent implements OnInit, AfterContentInit, OnDestroy {
  @Input() settings: { enableChat: boolean };
  @Input() label: string;
  @Input() description: string;
  @Input() playListId = '';

  playlistIdFieldName = 'playListId';

  mode = 'chat-wall';
  showChatQnASection = true;
  enableChat = true;
  enableModeration = false;
  userIsModerator = true;
  isChanged = true;
  constructor(
    store: Store<EventsState>,
    route: ActivatedRoute,
    router: Router,
    localStorage: LocalStorageService,
    loaderService: LoaderService,
    playlistService: PlaylistService,
  ) {
    super(store, route, router, localStorage, loaderService, playlistService);
  }

  openChat(): void {
    this.isChanged = true;
  }

  closeChat(): void {
    this.isChanged = false;
  }

  get isRealComm() {
    return this.settings?.enableChat;
  }
}
