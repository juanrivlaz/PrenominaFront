import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/attendace',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'attendace',
    loadComponent: () => import('./features/attendace/attendace.component').then(m => m.AttendaceComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'employee-adjustments',
    loadComponent: () => import('./features/employee-adjustments/employee-adjustments.component').then(m => m.EmployeeAdjustmentsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'import-attendance-logs',
    loadComponent: () => import('./features/import-attendance-logs/import-attendance-logs.component').then(m => m.ImportAttendaceLogComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'contracts',
    loadComponent: () => import('./features/contracts/contracts.component').then(m => m.ContractsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'worked-day-off',
    loadComponent: () => import('./features/worked-day-off/worked-day-off.component').then(m => m.WorkedDayOffComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'holiday-days',
    loadComponent: () => import('./features/holiday-days/holiday-days.component').then(m => m.HolidayDaysComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'sunday-monday',
    loadComponent: () => import('./features/sunday-bonus/sunday-bonus.component').then(m => m.SundayBonusComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'time-off-manager',
    loadComponent: () => import('./features/time-off-manager/time-off-manager.component').then(m => m.TimeOffManagerComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'roles',
    loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'pendings-attendance-incident',
    loadComponent: () => import('./features/pendings-attendance-incident/pendings-attendance-incident.component').then(m => m.PendingsAttendanceIncidentComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'period',
    loadComponent: () => import('./features/period/period.component').then(m => m.PeriodComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'incident-codes-manager',
    loadComponent: () => import('./features/incident-codes-manager/incident-codes-manager.component').then(m => m.IncidentCodesManagerComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'clocks',
    loadComponent: () => import('./features/clocks/clocks.component').then(m => m.ClocksComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'additional-pay',
    loadComponent: () => import('./features/additional-pay/additional-pay.component').then(m => m.AdditionalPayComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/attendace'
  }
];
