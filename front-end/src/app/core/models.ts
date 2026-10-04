export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Board {
  id: string;
  title: string;
  description?: string | null;
  userName?: string | null;
  archived: boolean;
  createdAt?: string;
}

export interface Card {
  id: string;
  boardId: string;
  title: string;
  description?: string | null;
  status: Status;
  priority: Priority;
  position: number;
  assigneeName?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface NewUser {
  name: string;
  email: string;
  senha: string;
}

export interface CardMove {
  id: string;
  status: Status;
  position: number;
}

export const STATUSES: { key: Status; label: string }[] = [
  { key: 'TODO', label: 'A fazer' },
  { key: 'IN_PROGRESS', label: 'Em andamento' },
  { key: 'DONE', label: 'Concluído' },
];

export const PRIORITIES: { key: Priority; label: string }[] = [
  { key: 'LOW', label: 'Baixa' },
  { key: 'MEDIUM', label: 'Média' },
  { key: 'HIGH', label: 'Alta' },
];

export const API_DOWN =
  'Não consegui falar com a API. Confira se a aplicação Java está rodando em localhost:8080 e se o MongoDB está ligado.';
