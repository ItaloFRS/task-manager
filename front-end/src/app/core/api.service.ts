import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Board, Card, CardMove, NewUser, User } from './models';

/**
 * Todas as chamadas à API Java. Em desenvolvimento o proxy (proxy.conf.json)
 * encaminha /api para http://localhost:8080, então não há problema de CORS.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private mongo = '/api/mongo';

  // ---------- Boards (MongoDB) ----------
  boards() {
    return firstValueFrom(this.http.get<Board[]>(`${this.mongo}/boards`));
  }

  createBoard(board: { title: string; description?: string; userName?: string }) {
    return firstValueFrom(this.http.post<Board>(`${this.mongo}/boards`, board));
  }

  deleteBoard(id: string) {
    return firstValueFrom(this.http.delete<{ deletedCards: number }>(`${this.mongo}/boards/${id}`));
  }

  // ---------- Cards (MongoDB) ----------
  cards() {
    return firstValueFrom(this.http.get<Card[]>(`${this.mongo}/cards`));
  }

  cardsByBoard(boardId: string) {
    return firstValueFrom(this.http.get<Card[]>(`${this.mongo}/cards/board/${boardId}`));
  }

  createCard(card: Partial<Card>) {
    return firstValueFrom(this.http.post<Card>(`${this.mongo}/cards`, card));
  }

  updateCard(id: string, card: Partial<Card>) {
    return firstValueFrom(this.http.put<Card>(`${this.mongo}/cards/${id}`, card));
  }

  moveCards(moves: CardMove[]) {
    return firstValueFrom(this.http.put<Card[]>(`${this.mongo}/cards/reorder`, moves));
  }

  deleteCard(id: string) {
    return firstValueFrom(this.http.delete(`${this.mongo}/cards/${id}`));
  }

  // ---------- Usuários (banco relacional, UserController) ----------
  users() {
    return firstValueFrom(this.http.get<User[]>('/api/users'));
  }

  createUser(user: NewUser) {
    return firstValueFrom(this.http.post<User>('/api/users', user));
  }
}
