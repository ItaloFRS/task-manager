import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'boards' },
  {
    path: 'boards',
    title: 'Quadros · Quadro',
    loadComponent: () => import('./pages/boards-page/boards-page').then((m) => m.BoardsPage),
  },
  {
    path: 'boards/:id',
    title: 'Quadro',
    loadComponent: () => import('./pages/board-page/board-page').then((m) => m.BoardPage),
  },
  {
    path: 'users',
    title: 'Usuários · Quadro',
    loadComponent: () => import('./pages/users-page/users-page').then((m) => m.UsersPage),
  },
  { path: '**', redirectTo: 'boards' },
];
