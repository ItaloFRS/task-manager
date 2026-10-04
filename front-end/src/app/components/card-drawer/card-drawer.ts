import { Component, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Card, PRIORITIES, Priority, STATUSES, Status } from '../../core/models';
import { fromDateInput, longDate, toDateInput } from '../../core/util';

@Component({
  selector: 'app-card-drawer',
  imports: [FormsModule],
  templateUrl: './card-drawer.html',
  styleUrl: './card-drawer.css',
})
export class CardDrawer implements OnInit {
  card = input.required<Card>();
  userNames = input<string[]>([]);

  saved = output<Card>();
  removed = output<string>();
  closed = output<void>();

  private api = inject(ApiService);

  readonly statuses = STATUSES;
  readonly priorities = PRIORITIES;

  saving = signal(false);
  confirmDelete = signal(false);
  error = signal<string | null>(null);

  draft = {
    title: '',
    description: '',
    status: 'TODO' as Status,
    priority: 'MEDIUM' as Priority,
    assignee: '',
    due: '',
  };

  protected longDate = longDate;

  ngOnInit() {
    const c = this.card();
    this.draft = {
      title: c.title,
      description: c.description ?? '',
      status: c.status,
      priority: c.priority,
      assignee: c.assigneeName ?? '',
      due: toDateInput(c.dueDate),
    };
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }

  async save() {
    const title = this.draft.title.trim();
    if (!title) {
      this.error.set('Dê um título ao cartão.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const c = this.card();
    try {
      const updated = await this.api.updateCard(c.id, {
        ...c,
        title,
        description: this.draft.description.trim() || null,
        status: this.draft.status,
        priority: this.draft.priority,
        assigneeName: this.draft.assignee.trim() || null,
        dueDate: fromDateInput(this.draft.due),
        // mudou de coluna pelo painel: vai para o fim da coluna nova
        position: this.draft.status !== c.status ? 9999 : c.position,
      });
      this.saved.emit(updated);
    } catch {
      this.error.set('Não consegui salvar. Tente de novo.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove() {
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      setTimeout(() => this.confirmDelete.set(false), 3500);
      return;
    }
    try {
      await this.api.deleteCard(this.card().id);
      this.removed.emit(this.card().id);
    } catch {
      this.error.set('Não consegui excluir o cartão.');
    }
  }
}
