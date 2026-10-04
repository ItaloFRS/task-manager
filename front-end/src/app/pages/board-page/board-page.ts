import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CardDrawer } from '../../components/card-drawer/card-drawer';
import { ApiService } from '../../core/api.service';
import { Autofocus } from '../../core/autofocus';
import { API_DOWN, Board, Card, CardMove, STATUSES, Status, User } from '../../core/models';
import { initials, isOverdue, priorityLabel, shortDate, tone } from '../../core/util';

type Columns = Record<Status, Card[]>;

function group(cards: Card[]): Columns {
  const cols: Columns = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const c of cards) (cols[c.status] ?? cols.TODO).push(c);
  for (const s of STATUSES) {
    cols[s.key].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0) || (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
    );
  }
  return cols;
}

@Component({
  selector: 'app-board-page',
  imports: [RouterLink, FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, CardDrawer, Autofocus],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
})
export class BoardPage {
  /** vem da rota /boards/:id (withComponentInputBinding) */
  id = input.required<string>();

  private api = inject(ApiService);

  board = signal<Board | null>(null);
  columns = signal<Columns>({ TODO: [], IN_PROGRESS: [], DONE: [] });
  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  composer = signal<Status | null>(null);
  selected = signal<Card | null>(null);

  draftTitle = '';
  private justDragged = false;

  readonly statuses = STATUSES;
  userNames = computed(() => this.users().map((u) => u.name));
  total = computed(() => STATUSES.reduce((n, s) => n + this.columns()[s.key].length, 0));
  done = computed(() => this.columns().DONE.length);

  protected initials = initials;
  protected tone = tone;
  protected shortDate = shortDate;
  protected priorityLabel = priorityLabel;
  protected isOverdue = isOverdue;

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
    this.api.users().then((u) => this.users.set(u)).catch(() => undefined);
  }

  async load(id: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [boards, cards] = await Promise.all([this.api.boards(), this.api.cardsByBoard(id)]);
      const board = boards.find((b) => b.id === id) ?? null;
      this.board.set(board);
      this.columns.set(group(cards));
      if (!board) this.error.set('Esse quadro não existe (talvez tenha sido excluído).');
    } catch {
      this.error.set(API_DOWN);
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- arrastar e soltar ----------
  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }

    // reindexa as colunas e envia só o que mudou
    const cols = this.columns();
    const moves: CardMove[] = [];
    for (const s of STATUSES) {
      cols[s.key].forEach((card, index) => {
        if (card.status !== s.key || card.position !== index) {
          card.status = s.key;
          card.position = index;
          moves.push({ id: card.id, status: s.key, position: index });
        }
      });
    }
    this.columns.set({ ...cols });
    void this.persist(moves);
  }

  private async persist(moves: CardMove[]) {
    if (!moves.length) return;
    try {
      await this.api.moveCards(moves);
    } catch {
      await this.load(this.id());
      this.error.set('Não consegui salvar a nova posição. Recarreguei o quadro.');
    }
  }

  dragStarted() {
    this.justDragged = true;
  }

  dragEnded() {
    // o "click" que vem logo depois do arrasto não deve abrir o cartão
    setTimeout(() => (this.justDragged = false));
  }

  // ---------- cartões ----------
  open(card: Card) {
    if (this.justDragged) return;
    this.selected.set(card);
  }

  openComposer(status: Status) {
    this.draftTitle = '';
    this.composer.set(status);
  }

  async addCard(status: Status) {
    const title = this.draftTitle.trim();
    const board = this.board();
    if (!title || !board) return;
    this.draftTitle = '';
    const list = this.columns()[status];
    try {
      const created = await this.api.createCard({
        boardId: board.id,
        title,
        status,
        priority: 'MEDIUM',
        position: list.length,
      });
      list.push(created);
      this.columns.set({ ...this.columns() });
    } catch {
      this.draftTitle = title;
      this.error.set('Não consegui criar o cartão.');
    }
  }

  onSaved(updated: Card) {
    const all = STATUSES.flatMap((s) => this.columns()[s.key]).map((c) => (c.id === updated.id ? updated : c));
    this.columns.set(group(all));
    this.selected.set(null);
  }

  onRemoved(id: string) {
    const all = STATUSES.flatMap((s) => this.columns()[s.key]).filter((c) => c.id !== id);
    this.columns.set(group(all));
    this.selected.set(null);
  }
}
