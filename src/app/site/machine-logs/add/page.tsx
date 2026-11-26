'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '../../../../components/layout/AppShell';
import { PageHeader } from '../../../../components/layout/PageHeader';
import { FormField } from '../../../../components/ui/FormField';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { SearchSelect } from '../../../../components/ui/SearchSelect';
import { SiteManageModal } from '../../../../components/ui/SiteManageModal';
import { useLanguage } from '../../../../context/LanguageContext';
import {
  Wrench,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  workOrderNo: string;
}

export default function AddMachineLogPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Site modal state
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [editSiteId, setEditSiteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    siteId: '',
    machineType: 'JCB',
    machineName: 'JCB 3DX Super Excavator',
    date: new Date().toISOString().split('T')[0],
    workDescription: '',
    workingHours: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadSites = async (selectId?: string) => {
    try {
      setLoadingSites(true);
      const res = await fetch('/api/sites', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSites(json.data);
        if (selectId) {
          setForm((prev) => ({ ...prev, siteId: selectId }));
        } else if (json.data.length > 0) {
          setForm((prev) => (prev.siteId ? prev : { ...prev, siteId: json.data[0].id }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleDeleteSite = async (siteId: string) => {
    const s = sites.find((x) => x.id === siteId);
    const sName = s?.name || 'Site';
    const confirmMsg =
      lang === 'hi'
        ? `क्या आप वाकई साइट "${sName}" को हटाना चाहते हैं?`
        : `Are you sure you want to delete site "${sName}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        if (form.siteId === siteId) setForm((prev) => ({ ...prev, siteId: '' }));
        await loadSites();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.siteId) {
      setErrorMsg(lang === 'hi' ? 'कृपया एक साइट चुनें' : 'Please select a site');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/site-operations/machine-logs', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          workingHours: form.workingHours ? parseFloat(form.workingHours) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || (lang === 'hi' ? 'लॉग दर्ज करने में त्रुटि' : 'Error saving machine log'));
      }

      router.push('/site/machine-logs');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save machine log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeNav="/site/machine-logs">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Site', href: '/site/dashboard' },
            { label: lang === 'hi' ? 'मशीन कार्य लॉग' : 'Machine Logs', href: '/site/machine-logs' },
            { label: lang === 'hi' ? 'लॉग दर्ज करें' : 'Record Log' },
          ]}
          title={lang === 'hi' ? 'मशीन कार्य लॉग दर्ज करें' : 'Record Machine Work Log'}
          description={
            lang === 'hi'
              ? 'जेसीबी, टिपर, रोलर आदि के दैनिक काम के घंटे व विवरण'
              : 'Log daily operational working hours and site work details'
          }
          actions={
            <Link href="/site/machine-logs">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                {lang === 'hi' ? 'वापस' : 'Back'}
              </Button>
            </Link>
          }
        />

        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger/30 rounded-lg text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <SearchSelect
              labelHi="साइट चुनें (Construction Site)"
              labelEn="Select Site"
              required
              placeholder={
                loadingSites
                  ? (lang === 'hi' ? 'साइट्स लोड हो रही हैं...' : 'Loading sites...')
                  : (lang === 'hi' ? 'साइट चुनें...' : 'Select site...')
              }
              options={sites.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.workOrderNo})`,
                labelHi: `${s.name} (${s.workOrderNo})`,
                labelEn: `${s.name} (${s.workOrderNo})`,
              }))}
              value={form.siteId}
              onChange={(val) => setForm({ ...form, siteId: val })}
              allowQuickAdd
              quickAddLabel={lang === 'hi' ? '+ नई साइट जोड़ें' : '+ Add New Site'}
              onQuickAdd={() => {
                setEditSiteId(null);
                setShowSiteModal(true);
              }}
              onEditOption={(sId) => {
                setEditSiteId(sId);
                setShowSiteModal(true);
              }}
              onDeleteOption={handleDeleteSite}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Machine Type *" labelHi="मशीन का प्रकार *" required>
                <select
                  value={form.machineType}
                  onChange={(e) => setForm({ ...form, machineType: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                >
                  <option value="JCB">JCB Excavator</option>
                  <option value="Tipper">Tipper Truck</option>
                  <option value="Crane">Hydraulic Crane</option>
                  <option value="Roller">Road Roller</option>
                  <option value="Mixer">Transit Mixer</option>
                  <option value="Tractor">Tractor Trolley</option>
                </select>
              </FormField>

              <FormField labelEn="Date *" labelHi="तारीख *" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField labelEn="Machine Name / Number" labelHi="मशीन का नाम / नंबर">
                <input
                  type="text"
                  placeholder="e.g. JCB 3DX #02"
                  value={form.machineName}
                  onChange={(e) => setForm({ ...form, machineName: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
                />
              </FormField>

              <FormField labelEn="Working Hours" labelHi="कार्य के घंटे">
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 7.5"
                  value={form.workingHours}
                  onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand tabular-nums"
                />
              </FormField>
            </div>

            <FormField labelEn="Work Description *" labelHi="कार्य का विवरण *" required>
              <textarea
                rows={3}
                placeholder={lang === 'hi' ? 'उदा. चेनज 42+200 से 42+400 तक मिट्टी खुदाई व लेवलिंग कार्य' : 'e.g. Earthwork excavation and site leveling between chainage 42+200 and 42+400'}
                value={form.workDescription}
                onChange={(e) => setForm({ ...form, workDescription: e.target.value })}
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Link href="/site/machine-logs">
                <Button variant="secondary" type="button">
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
              >
                {lang === 'hi' ? 'लॉग सहेजें' : 'Save Machine Log'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <SiteManageModal
        isOpen={showSiteModal}
        onClose={() => {
          setShowSiteModal(false);
          setEditSiteId(null);
        }}
        onRefresh={async (selectId) => {
          await loadSites(selectId);
        }}
        editSiteId={editSiteId}
      />
    </AppShell>
  );
}
