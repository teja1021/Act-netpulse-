import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path:'login', loadComponent:()=>import('./features/auth/login.component').then(m=>m.LoginComponent) },
  {
    path:'',
    canActivate:[authGuard],
    loadComponent:()=>import('./shared/layout/layout.component').then(m=>m.LayoutComponent),
    children:[
      { path:'',           redirectTo:'speed-test', pathMatch:'full' },
      { path:'speed-test', loadComponent:()=>import('./features/speed-test/speed-test.component').then(m=>m.SpeedTestComponent) },
      { path:'dashboard',  loadComponent:()=>import('./features/dashboard/dashboard.component').then(m=>m.DashboardComponent) },
      { path:'history',    loadComponent:()=>import('./features/history/history.component').then(m=>m.HistoryComponent) },
      { path:'settings',   loadComponent:()=>import('./features/settings/settings.component').then(m=>m.SettingsComponent) }
    ]
  },
  { path:'**', redirectTo:'' }
];
