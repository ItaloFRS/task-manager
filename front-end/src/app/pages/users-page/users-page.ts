import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { API_DOWN, User } from '../../core/models';
import { initials, longDate, tone } from '../../core/util';

@Component({
  selector: 'app-users-page',
  imports: [FormsModule],
  templateUrl: './users-page.html',
  styleUrl: './users-page.css',
})
export class UsersPage implements OnInit {
  private api = inject(ApiService);

  users = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  formError = signal<string | null>(null);
  justCreated = signal<string | null>(null);

  form = { name: '', email: '', senha: '' };

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
      this.users.set(await this.api.users());
    } catch {
      this.error.set(API_DOWN);
    } finally {
      this.loading.set(false);
    }
  }

  async submit(f: NgForm) {
    if (f.invalid || this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    this.justCreated.set(null);
    try {
      const created = await this.api.createUser({
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        senha: this.form.senha,
      });
      this.users.update((list) => [...list, created]);
      this.justCreated.set(created.name);
      f.resetForm();
    } catch {
      this.formError.set('Não foi possível criar o usuário. Esse e-mail já pode estar cadastrado.');
    } finally {
      this.saving.set(false);
    }
  }
}
