import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { CalenderOpportunity } from './core/calender-opportunity/calender-opportunity';
import { Edit } from './core/edit/edit';
import { ForgetPass } from './auth/forget-pass/forget-pass';
import { Preview } from './core/preview/preview';

import { AuthGuard } from './core/guards/auth-guard';
import { Dashboard } from './core/dashboard/dashboard';
import { AddnewEdit } from './core/addnew-edit/addnew-edit';
import { MemberModule } from './core/member-module/member-module';
import { EditMemberComponent } from './core/edit-member/edit-member';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./core/dashboard/dashboard').then(m => m.Dashboard),
  //   // canActivate: [AuthGuard]
  // },

  {
    path: 'login',
    component: Login,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    data: { breadcrumb: 'Dashboard' },
  },
  {
    path: 'calendar-opportunity',
    component: CalenderOpportunity,
    data: { breadcrumb: 'calendar-opportunity' },
    // canActivate: [AuthGuard]
  },
  {
    path: 'calendar-opportunity/edit/:id',
    component: Edit,
    data: { breadcrumb: 'edit' },
  },
  {
    path: 'forget',
    component: ForgetPass,
    canActivate: [AuthGuard],
  },
  {
    path: 'calendar-opportunity/edit/add-new',
    component: Preview,
    // canActivate: [AuthGuard]
  },
  {
    path: 'calendar-opportunity/add-new',
    component: AddnewEdit,
    // canActivate: [AuthGuard]
  },
  {
    path: 'premium-members/memberModule',
    component: MemberModule,
    // canActivate: [AuthGuard]
  },
  {
    path: 'premium-members/edit-member/:id',
    component: EditMemberComponent,
    // canActivate: [AuthGuard]
  },
  
];
