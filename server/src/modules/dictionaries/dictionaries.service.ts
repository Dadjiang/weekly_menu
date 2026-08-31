import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../storage/database/supabase-client';

export interface DictionaryItem {
  id: string;
  type: string;
  label: string;
  value: string;
  sort_order: number;
}

interface DictionaryRow {
  id: string;
  type: string;
  code: string;
  name: string;
  sort_order: number;
}

@Injectable()
export class DictionariesService {
  private get client() {
    return getSupabaseClient();
  }

  private mapRow(row: DictionaryRow): DictionaryItem {
    return {
      id: row.id,
      type: row.type,
      label: row.name,
      value: row.code,
      sort_order: row.sort_order,
    };
  }

  async findAll(): Promise<Record<string, DictionaryItem[]>> {
    const { data, error } = await this.client
      .from('dictionaries')
      .select('*')
      .order('type', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`查询字典数据失败: ${error.message}`);

    const grouped: Record<string, DictionaryItem[]> = {};
    for (const row of (data || []) as DictionaryRow[]) {
      const item = this.mapRow(row);
      if (!grouped[item.type]) {
        grouped[item.type] = [];
      }
      grouped[item.type].push(item);
    }
    return grouped;
  }

  async findByType(type: string): Promise<DictionaryItem[]> {
    const { data, error } = await this.client
      .from('dictionaries')
      .select('*')
      .eq('type', type)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`查询字典数据失败: ${error.message}`);
    return ((data || []) as DictionaryRow[]).map(this.mapRow.bind(this));
  }
}
