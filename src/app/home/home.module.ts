// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { HomeMainComponent } from './components/home-main/home-main.component';
import { HomeComponent } from './components/home/home.component';
import * as fromComponents from './components';
import { SharedModule } from '../shared/shared.module';
import { HomePlaylistComponent } from './components/home-playlist/home-playlist.component';
import { MatTabsModule } from '@angular/material/tabs';

// tslint:disable-next-line:class-name
const routes: Routes = [
	{
		path: '',
		component: HomeMainComponent,
		children: [
			{
				path: '',
				pathMatch: 'full',
				component: HomeComponent,
      },
      {
        path: 'undefined',
        pathMatch: 'full',
        component: HomeComponent,
      }
		]
	}
];

@NgModule({
	imports: [
		CommonModule,
		HttpClientModule,
		RouterModule.forChild(routes),
		SharedModule,
		CarouselModule,
		FormsModule,
		MatTabsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatCardModule,
		MatSidenavModule,
		SharedModule
	],
	providers: [

	],
	entryComponents: [
	],
	declarations: [
		...fromComponents.components,
		HomePlaylistComponent
	]
})
export class HomeModule { }
