import { useEffect, useState } from 'react';
import { supabase, type AppSettings, type StandardFieldKey, DEFAULT_ENABLED_FIELDS } from '@/lib/supabase';

const DEFAULT_SETTINGS: AppSettings = {
  enabledFields: DEFAULT_ENABLED_FIELDS,
  customFields: [],
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from('settings')
      .select('enabled_fields, custom_fields')
      .eq('id', 1)
      .maybeSingle();
    if (data) {
      setSettings({
        enabledFields: (data.enabled_fields as StandardFieldKey[]) ?? DEFAULT_ENABLED_FIELDS,
        customFields: (data.custom_fields as typeof DEFAULT_SETTINGS.customFields) ?? [],
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(next: AppSettings) {
    setSettings(next);
    await supabase
      .from('settings')
      .upsert({
        id: 1,
        enabled_fields: next.enabledFields,
        custom_fields: next.customFields,
        updated_at: new Date().toISOString(),
      });
  }

  return { settings, loading, save, reload: load };
}
