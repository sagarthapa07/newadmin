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
import { EmailSetting } from './core/email-setting/email-setting';
import { UserList } from './core/user-list/user-list';
import { BusinessPlans } from './core/business-plans/business-plans';

import { EmailSettingEdit } from './core/email-setting-edit/email-setting-edit';
import { UserEdit } from './core/user-edit/user-edit';
import { UserAdd } from './core/user-add/user-add';
import { BusinessPlansAdd } from './core/business-plans-add/business-plans-add';
import { BusinessPlanEdit } from './core/business-plan-edit/business-plan-edit';
import { EmailSettingAdd } from './core/email-setting-add/email-setting-add';
import { EmailTemplatesAdd } from './core/email-templates-add/email-templates-add';
import { EmailTemp } from './core/email-temp/email-temp';
import { EmailTemplates } from './core/email-templates/email-templates';
import { PandingGrants } from './core/panding-grants/panding-grants';

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
    path: 'calendar/list',
    component: CalenderOpportunity,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'calendar/list' },
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
    path: 'calendar/list/edit/:id',
    component: Edit,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'edit' },
  },
  {
    path: 'calendar/list/edit/preview/:id',
    component: Preview,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'edit' },
  },

  {
    path: 'calendar/list/edit/add-new',
    component: Preview,
    canActivate: [AuthGuard],
  },

  {
    path: 'calendar/list/add-new',
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
  {
    path: 'masters/email-settings',
    component: EmailSetting,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/email-templates',
    component: EmailTemp,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/users',
    component: UserList,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/user/:id',
    component: UserList,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/plans',
    component: BusinessPlans,
    canActivate: [AuthGuard],
  },

  {
    path: 'masters/email-templates/edit/:id',
    component: EmailTemplates,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/email-setting-edit/:id',
    component: EmailSettingEdit,
    canActivate: [AuthGuard],
  },
  {
    path: 'user-edit/:id',
    component: UserEdit,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/user-add',
    component: UserAdd,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/business-plan-add',
    component: BusinessPlansAdd,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/business-plan-edit/:id',
    component: BusinessPlanEdit,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/email-setting-add',
    component: EmailSettingAdd,
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/email-templates-add',
    component: EmailTemplatesAdd,
    canActivate: [AuthGuard],
  },
  {
    path: 'calendar/panding-grants',
    component: PandingGrants,
    canActivate: [AuthGuard],
  },
];
