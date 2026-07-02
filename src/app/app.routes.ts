import { Routes } from '@angular/router';

import { Login } from './auth/login/login';
import { ForgetPass } from './auth/forget-pass/forget-pass';

import { Dashboard } from './core/dashboard/dashboard';
import { CalenderOpportunity } from './core/calender-opportunity/calender-opportunity';
import { Edit } from './core/edit/edit';
import { Preview } from './core/preview/preview';
import { AddnewEdit } from './core/addnew-edit/addnew-edit';

import { MemberModule } from './core/member-module/member-module';
import { EditMemberComponent } from './core/edit-member/edit-member';
import { EditInvoice } from './core/edit-invoice/edit-invoice';
import { AddMember } from './core/add-member/add-member';
import { MemberSearch } from './core/member-search/member-search';

import { AuthGuard } from './core/guards/auth-guard';
import { Invoice } from './core/invoice/invoice';
import { InvoiceDetails } from './core/invoice-details/invoice-details';

export const routes: Routes = [
  {
    path: '',
    component: Dashboard,
    canActivate: [AuthGuard],
    pathMatch: 'full',
    data: { breadcrumb: 'Dashboard' },
  },

  {
    path: 'login',
    component: Login,
  },

  {
    path: 'calendar-opportunity',
    component: CalenderOpportunity,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'calendar-opportunity' },
  },

  {
    path: 'login',
    component: Login,
  },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Dashboard' },
  },

  {
    path: 'calendar-opportunity/edit/:id',
    component: Edit,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'edit' },
  },

  {
    path: 'calendar-opportunity/edit/add-new',
    component: Preview,
    canActivate: [AuthGuard],
  },

  {
    path: 'calendar-opportunity/add-new',
    component: AddnewEdit,
    canActivate: [AuthGuard],
  },

  {
    path: 'forget',
    component: ForgetPass,
    canActivate: [AuthGuard],
  },

  {
    path: 'premium-members/memberModule',
    component: MemberModule,
    canActivate: [AuthGuard],
  },

  {
    path: 'premium-members/edit-member/:id',
    component: EditMemberComponent,
    canActivate: [AuthGuard],
  },

  {
    path: 'premium-members/edit-invoice/:memberId/:invoiceId',
    component: EditInvoice,
    canActivate: [AuthGuard],
  },

  {
    path: 'premium-members/add-member',
    component: AddMember,
    canActivate: [AuthGuard],
  },

  {
    path: 'premium-members/member-search',
    component: MemberSearch,
    canActivate: [AuthGuard],
  },
  {
    path: 'premium-members/invoice',
    component: Invoice,
    canActivate: [AuthGuard],
  },
  {
    path: 'premium-members/invoice-details/:id',
    component: InvoiceDetails,
    canActivate: [AuthGuard],
  },



  

];
