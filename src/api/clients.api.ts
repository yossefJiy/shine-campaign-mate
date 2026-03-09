// Clients API

import { BaseAPI } from './base';

export interface ClientRow {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  is_master_account: boolean;
  modules_enabled: Record<string, boolean> | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  tiktok_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  name: string;
  description?: string;
  industry?: string;
  website?: string;
}

export class ClientsAPI extends BaseAPI {
  async list() {
    return this.request<ClientRow[]>(async () => {
      return this.client
        .from('clients')
        .select('*')
        .is('deleted_at', null)
        .order('name');
    });
  }

  async getById(id: string) {
    return this.request<ClientRow>(async () => {
      return this.client
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async create(data: CreateClientInput) {
    return this.request<ClientRow>(async () => {
      return this.client
        .from('clients')
        .insert({
          name: data.name,
          description: data.description ?? null,
          industry: data.industry ?? null,
          website: data.website ?? null,
        })
        .select()
        .single();
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.request<ClientRow>(async () => {
      return this.client
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async archive(id: string) {
    return this.request<ClientRow>(async () => {
      return this.client
        .from('clients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async restore(id: string) {
    return this.request<ClientRow>(async () => {
      return this.client
        .from('clients')
        .update({ deleted_at: null })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async getMasterAccount() {
    return this.request<ClientRow>(async () => {
      return this.client
        .from('clients')
        .select('*')
        .eq('is_master_account', true)
        .limit(1)
        .maybeSingle();
    });
  }
}

export const clientsAPI = new ClientsAPI();
