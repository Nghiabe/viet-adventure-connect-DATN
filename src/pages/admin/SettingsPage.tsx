import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'general'|'permissions'|'payments'|'notifications'|'integrations'>('general');
  const [dirty, setDirty] = useState(false);
  const [settings, setSettings] = useState<any>({ general:{}, payments:{}, notifications:{ templates:[] }, integrations:{} });
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  useEffect(()=>{ (async()=>{
    const s = await api<{ success:boolean; data:any }>(`/api/admin/settings`);
    if (s?.data) setSettings(s.data);
    const r = await api<{ success:boolean; data:any[] }>(`/api/admin/roles`);
    setRoles(r.data||[]);
    setSelectedRole((r.data||[])[0]||null);
  })(); }, []);

  async function save() {
    await api(`/api/admin/settings`, { method:'PUT', body: JSON.stringify(settings) });
    setDirty(false);
  }

  function General() {
    const g = settings.general || {};
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-semibold mb-3">{t('admin_settings.general_section.business_info_title')}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="mb-1">{t('admin_settings.general_section.site_name_label')}</div><Input value={g.siteName||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, general: { ...s.general, siteName: e.target.value } })); setDirty(true); }} /></div>
            <div><div className="mb-1">{t('admin_settings.general_section.slogan_label')}</div><Input value={g.slogan||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, general: { ...s.general, slogan: e.target.value } })); setDirty(true); }} /></div>
            <div className="col-span-2"><div className="mb-1">{t('admin_settings.general_section.logo_url_label')}</div><Input value={g.logoUrl||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, general: { ...s.general, logoUrl: e.target.value } })); setDirty(true); }} /></div>
            <div><div className="mb-1">{t('admin_settings.general_section.contact_email_label')}</div><Input value={g.contactEmail||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, general: { ...s.general, contactEmail: e.target.value } })); setDirty(true); }} /></div>
            <div><div className="mb-1">{t('admin_settings.general_section.contact_phone_label')}</div><Input value={g.contactPhone||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, general: { ...s.general, contactPhone: e.target.value } })); setDirty(true); }} /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-semibold mb-3">{t('admin_settings.maintenance_section.title')}</div>
          <div className="flex items-center justify-between"><div>{t('admin_settings.maintenance_section.enable_label')}</div><Switch checked={!!g.maintenanceMode} onCheckedChange={(v)=>{ setSettings((s:any)=> ({ ...s, general: { ...s.general, maintenanceMode: v } })); setDirty(true); }} /></div>
          <div className="mt-3"><div className="mb-1 text-sm">{t('admin_settings.maintenance_section.message_label')}</div><Textarea rows={4} value={g.maintenanceMessage||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, general: { ...s.general, maintenanceMessage: e.target.value } })); setDirty(true); }} /></div>
        </Card>
      </div>
    );
  }

  function Permissions() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1">
          <div className="font-semibold mb-3">{t('admin_settings.permissions_section.roles_title')}</div>
          <div className="space-y-2">
            {roles.map((r)=> (
              <div key={r._id} className={`p-2 rounded cursor-pointer ${selectedRole?._id===r._id?'bg-muted':''}`} onClick={()=> setSelectedRole(r)}>{r.name}</div>
            ))}
            <Button size="sm">{t('admin_settings.permissions_section.new_role_button')}</Button>
          </div>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <div className="font-semibold mb-3">{t('admin_settings.permissions_section.permission_matrix_title')}</div>
          <div className="text-sm text-muted-foreground mb-2">{t('admin_settings.permissions_section.permission_matrix_description')}</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left p-2">Tài nguyên</th>{[t('admin_settings.permissions_section.actions.create'),t('admin_settings.permissions_section.actions.read'),t('admin_settings.permissions_section.actions.update'),t('admin_settings.permissions_section.actions.delete')].map((h)=> (<th key={h} className="text-center p-2">{h}</th>))}</tr></thead>
              <tbody>
                {[t('admin_settings.permissions_section.resources.tours'),t('admin_settings.permissions_section.resources.bookings'),t('admin_settings.permissions_section.resources.destinations'),t('admin_settings.permissions_section.resources.stories'),t('admin_settings.permissions_section.resources.reviews'),t('admin_settings.permissions_section.resources.users'),t('admin_settings.permissions_section.resources.marketing'),t('admin_settings.permissions_section.resources.analytics'),t('admin_settings.permissions_section.resources.settings')].map((res)=> {
                  return (
                    <tr key={res} className="border-b">
                      <td className="p-2">{res}</td>
                      {['create','read','update','delete'].map((act)=> {
                        const key = `${res.toLowerCase()}:${act}`;
                        const checked = (selectedRole?.permissions||[]).includes(key);
                        return <td key={key} className="text-center p-2"><input type="checkbox" checked={checked} onChange={(e)=> {
                          const next = new Set(selectedRole?.permissions||[]);
                          e.target.checked ? next.add(key) : next.delete(key);
                          setSelectedRole((r:any)=> ({ ...r, permissions: Array.from(next) }));
                        }} /></td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  function Payments() {
    const p = settings.payments || {};
    const gateways = [
      { key: 'vnPay', name: t('admin_settings.payments_section.gateways.vnpay') },
      { key: 'momo', name: t('admin_settings.payments_section.gateways.momo') },
      { key: 'stripe', name: t('admin_settings.payments_section.gateways.stripe') },
    ] as const;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {gateways.map((g)=> {
          const cfg = p[g.key] || {} as any;
          return (
            <Card key={g.key} className="p-4">
              <div className="font-semibold mb-3">{g.name}</div>
              <div className="flex items-center justify-between mb-3"><div>{t('admin_settings.payments_section.enabled_label')}</div><Switch checked={!!cfg.enabled} onCheckedChange={(v)=>{ setSettings((s:any)=> ({ ...s, payments: { ...s.payments, [g.key]: { ...(s.payments?.[g.key]||{}), enabled: v } } })); setDirty(true); }} /></div>
              <div className="mb-2 text-sm">{t('admin_settings.payments_section.api_key_label')}</div>
              <Input type="password" value={cfg.apiKey||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, payments: { ...s.payments, [g.key]: { ...(s.payments?.[g.key]||{}), apiKey: e.target.value } } })); setDirty(true); }} />
              <div className="mt-2 mb-2 text-sm">{t('admin_settings.payments_section.secret_label')}</div>
              <Input type="password" value={cfg.secret||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, payments: { ...s.payments, [g.key]: { ...(s.payments?.[g.key]||{}), secret: e.target.value } } })); setDirty(true); }} />
            </Card>
          );
        })}
      </div>
    );
  }

  function Notifications() {
    const tpls = settings.notifications?.templates || [];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-semibold mb-3">{t('admin_settings.notifications_section.templates_title')}</div>
          <div className="space-y-2">
            {tpls.map((t:any, idx:number)=> (
              <div key={idx} className="border rounded p-2">
                <div className="text-sm">{t.name} <span className="text-muted-foreground">({t.key})</span></div>
                <div className="mt-2 text-sm">{t('admin_settings.notifications_section.subject_label')}</div>
                <Input value={t.subject||''} onChange={(e)=> { const next = [...tpls]; next[idx] = { ...next[idx], subject: e.target.value }; setSettings((s:any)=> ({ ...s, notifications: { ...s.notifications, templates: next } })); setDirty(true); }} />
                <div className="mt-2 text-sm">{t('admin_settings.notifications_section.body_label')}</div>
                <Textarea rows={8} value={t.body||''} onChange={(e)=> { const next = [...tpls]; next[idx] = { ...next[idx], body: e.target.value }; setSettings((s:any)=> ({ ...s, notifications: { ...s.notifications, templates: next } })); setDirty(true); }} />
                <div className="mt-2"><Button size="sm" variant="outline" onClick={async()=>{ await api(`/api/admin/notifications/send-test`, { method:'POST' }); }}>{t('admin_settings.notifications_section.send_test_button')}</Button></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="font-semibold mb-3">{t('admin_settings.notifications_section.available_placeholders_title')}</div>
          <div className="text-sm space-y-1">
            {[t('admin_settings.notifications_section.placeholders.customer_name'),t('admin_settings.notifications_section.placeholders.tour_title'),t('admin_settings.notifications_section.placeholders.booking_date'),t('admin_settings.notifications_section.placeholders.total_price')].map((ph)=> (
              <div key={ph} className="flex items-center justify-between border rounded p-2"><code>{ph}</code><Button size="sm" variant="secondary" onClick={()=> navigator.clipboard.writeText(ph)}>{t('admin_settings.notifications_section.copy_button')}</Button></div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function Integrations() {
    const i = settings.integrations || {};
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-semibold mb-3">{t('admin_settings.integrations_section.google_analytics_title')}</div>
          <div className="text-sm mb-1">{t('admin_settings.integrations_section.measurement_id_label')}</div>
          <Input value={i.googleAnalyticsId||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, integrations: { ...s.integrations, googleAnalyticsId: e.target.value } })); setDirty(true); }} />
        </Card>
        <Card className="p-4">
          <div className="font-semibold mb-3">{t('admin_settings.integrations_section.facebook_pixel_title')}</div>
          <div className="text-sm mb-1">{t('admin_settings.integrations_section.pixel_id_label')}</div>
          <Input value={i.facebookPixelId||''} onChange={(e)=>{ setSettings((s:any)=> ({ ...s, integrations: { ...s.integrations, facebookPixelId: e.target.value } })); setDirty(true); }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="text-2xl font-semibold flex-1">{t('admin_settings.title')}</div>
        <Button onClick={save} disabled={!dirty}>{t('admin_settings.save_button')}</Button>
      </div>
      <Tabs value={tab} onValueChange={(v)=> setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="general">{t('admin_settings.tabs.general')}</TabsTrigger>
          <TabsTrigger value="permissions">{t('admin_settings.tabs.permissions')}</TabsTrigger>
          <TabsTrigger value="payments">{t('admin_settings.tabs.payments')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('admin_settings.tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="integrations">{t('admin_settings.tabs.integrations')}</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><General /></TabsContent>
        <TabsContent value="permissions"><Permissions /></TabsContent>
        <TabsContent value="payments"><Payments /></TabsContent>
        <TabsContent value="notifications"><Notifications /></TabsContent>
        <TabsContent value="integrations"><Integrations /></TabsContent>
      </Tabs>
    </div>
  );
}


