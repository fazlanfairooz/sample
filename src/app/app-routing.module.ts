import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';
import { RouteResolver } from './core/virtual-events/resolvers/route.resolver';
import { PageIdsEnum } from './core/virtual-events/enums/page-ids.model';
import { RegisterMainComponent } from './auth/components/register-main/register-main.component';

const routes: Routes = [

  {
    path: ':EventName/auth/register',
    component: RegisterMainComponent,
    data: { pageId: PageIdsEnum.Register },
    resolve: { header: RouteResolver }
  },
  {
    path: ':EventName/badges',
    component: RegisterMainComponent,
    data: { pageId: PageIdsEnum.Register },
    resolve: { header: RouteResolver }
  },
  {
    path: ':EventName/auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    data: { pageId: PageIdsEnum.Login },
    resolve: { header: RouteResolver }
  },
  {
    path: ':EventName/overview',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    data: { pageId: PageIdsEnum.Home },
    resolve: { header: RouteResolver }
  },
  {
    path: ':EventName/home',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    data: { pageId: PageIdsEnum.Home },
    resolve: { header: RouteResolver }
  },
  {
    path: ':EventName/Home',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    data: { pageId: PageIdsEnum.Home },
    resolve: { header: RouteResolver }
  },
  {
    path: ':EventName',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    data: { pageId: PageIdsEnum.DefaultPage },
    resolve: { header: RouteResolver }
  },
  {
    path: '**',
    pathMatch: 'full',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    initialNavigation: 'enabled'
}),
  ],
  exports: [RouterModule],
  providers: []
})
export class PagesRoutingModule {
}
