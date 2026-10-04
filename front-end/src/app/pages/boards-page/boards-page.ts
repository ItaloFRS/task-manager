import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Autofocus } from '../../core/autofocus';
import { API_DOWN, Board, Card, User } from '../../core/models';
import { initials, longDate, tone } from '../../core/util';

@Component({
  selector: 'app-boards-page',
  imports: [RouterLink, FormsModule, Autofocus],
  templateUrl: './boards-page.html',
  styleUrl: './boards-page.css',
})
export class BoardsPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  boards = signal<Board[]>([]);
  cards = signal<Card[]>([]);
  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  creating = signal(false);
  saving = signal(false);
  confirming = signal<string | null>(null);

  draft = { title: '', description: '', userName: '' };

  userNames = computed(() => this.users().map((u) => u.name));

  /** total e concluídos por quadro */
  stats = computed(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const c of this.cards()) {
      const s = map.get(c.boardId) ?? { total: 0, done: 0 };
      s.total++;
      if (c.status === 'DONE') s.done++;
      map.set(c.boardId, s);
    }
    return map;
  });

  protected initials = initials;
  protected tone = tone;
  protected longDate = longDate;

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [boards, cards] = await Promise.all([this.api.boards(), this.api.cards()]);
      this.boards.set(boards);
      this.cards.set(cards);
    } catch {
      this.error.set(API_DOWN);
    } finally {
      this.loading.set(false);
    }
    // os nomes de usuários só ajudam no autocompletar; se falhar, tudo bem
    this.api.users().then((u) => this.users.set(u)).catch(() => undefined);
  }

  progress(boardId: string): number {
    const s = this.stats().get(boardId);
    return s && s.total ? Math.round((s.done / s.total) * 100) : 0;
  }

  openForm() {
    this.draft = { title: '', description: '', userName: '' };
    this.creating.set(true);
  }

  async create() {
    const title = this.draft.title.trim();
    if (!title || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const created = await this.api.createBoard({
        title,
        description: this.draft.description.trim() || undefined,
        userName: this.draft.userName.trim() || undefined,
      });
      this.creating.set(false);
      await this.router.navigate(['/boards', created.id]);
    } catch {
      this.error.set('Não consegui criar o quadro. Tente de novo.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(board: Board) {
    if (this.confirming() !== board.id) {
      this.confirming.set(board.id);
      setTimeout(() => {
        if (this.confirming() === board.id) this.confirming.set(null);
      }, 3500);
      return;
    }
    this.confirming.set(null);
    try {
      await this.api.deleteBoard(board.id);
      this.boards.update((list) => list.filter((b) => b.id !== board.id));
      this.cards.update((list) => list.filter((c) => c.boardId !== board.id));
    } catch {
      this.error.set('Não consegui excluir o quadro.');
    }
  }
}
