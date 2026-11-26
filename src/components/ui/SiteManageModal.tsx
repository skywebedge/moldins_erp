'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Trash2, AlertTriangle, Building, MapPin, X, Calendar } from 'lucide-react';

export interface SiteItem {
  id: string;
  name: string;
  nameHindi?: string | null;
  workOrderNo: string;
  department: string;
  orderValue?: number | string;
  location?: string | null;
  startDate?: string;
  completionDate?: string;
}

export interface SiteManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteCreated?: (site: SiteItem) => void;
  onSiteUpdated?: (site: SiteItem) => void;
  onSiteDeleted?: (siteId: string) => void;
  onRefresh?: (selectedId?: string) => void | Promise<void>;
  editSiteId?: string | null;
}

export const SiteManageModal: React.FC<SiteManageModalProps> = ({
  isOpen,
  onClose,
  onSiteCreated,
  onSiteUpdated,
  onSiteDeleted,
  onRefresh,
  editSiteId,
}) => {
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [sites, setSites] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [editingSite, setEditingSite] = useState<SiteItem | null>(null);
  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [workOrderNo, setWorkOrderNo] = useState('');
  const [department, setDepartment] = useState('PWD');
  const [orderValue, setOrderValue] = useState('1000000');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [completionDate, setCompletionDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('moldins_token') || localStorage.getItem('token')) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchSites = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/sites', { headers: getAuthHeaders(), credentials: 'include' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSites(json.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSites().then(() => {
        if (editSiteId) {
          const target = sites.find((s) => s.id === editSiteId);
          if (target) {
            handleStartEdit(target);
            return;
          }
        }
        handleResetForm();
      });
    }
  }, [isOpen, editSiteId, fetchSites]);

  const handleResetForm = () => {
    setEditingSite(null);
    setName('');
    setNameHindi('');
    setWorkOrderNo('');
    setDepartment('PWD');
    setOrderValue('1000000');
    setLocation('');
    setErrorMsg('');
  };

  const handleStartEdit = (s: SiteItem) => {
    setEditingSite(s);
    setName(s.name);
    setNameHindi(s.nameHindi || '');
    setWorkOrderNo(s.workOrderNo || '');
    setDepartment(s.department || 'PWD');
    setOrderValue(String(s.orderValue || '1000000'));
    setLocation(s.location || '');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(lang === 'hi' ? 'साइट का नाम आवश्यक है' : 'Site name is required');
      return;
    }
    if (!workOrderNo.trim()) {
      setErrorMsg(lang === 'hi' ? 'वर्क ऑर्डर नंबर आवश्यक है' : 'Work order number is required');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        nameHindi: nameHindi.trim() || undefined,
        workOrderNo: workOrderNo.trim(),
        department: department.trim() || 'PWD',
        orderValue: Number(orderValue) || 100000,
        location: location.trim() || undefined,
        startDate,
        completionDate,
      };

      if (editingSite) {
        const res = await fetch(`/api/sites/${editingSite.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          toast.success(
            lang === 'hi' ? 'साइट विवरण अपडेट हो गया!' : 'Site updated successfully!',
            name.trim()
          );
          if (onSiteUpdated) onSiteUpdated(json.data);
          handleResetForm();
          await fetchSites();
          if (onRefresh) await onRefresh(editingSite.id);
        } else {
          setErrorMsg(json.error || json.message || 'Failed to update site');
        }
      } else {
        const res = await fetch('/api/sites', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          toast.success(
            lang === 'hi' ? 'नई साइट सफलतापूर्वक जोड़ी गई!' : 'Site created successfully!',
            name.trim()
          );
          if (onSiteCreated) onSiteCreated(json.data);
          handleResetForm();
          await fetchSites();
          if (onRefresh) await onRefresh(json.data.id);
        } else {
          setErrorMsg(json.error || json.message || 'Failed to create site');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (siteId: string, siteName: string) => {
    setDeletingId(siteId);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          lang === 'hi' ? 'साइट हटा दी गई!' : 'Site deleted successfully!',
          siteName
        );
        if (onSiteDeleted) onSiteDeleted(siteId);
        if (editingSite?.id === siteId) handleResetForm();
        await fetchSites();
        if (onRefresh) await onRefresh();
      } else {
        setErrorMsg(json.error || json.message || 'Failed to delete site');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lang === 'hi' ? 'निर्माण साइट्स प्रबंधित करें (Manage Sites)' : 'Manage & Add Construction Sites'}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-3 bg-danger-bg border border-danger/30 rounded text-xs text-danger flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Add / Edit Form */}
        <div className="p-4 bg-page rounded-lg border border-border">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Building className="w-4 h-4 text-brand" />
              <span>
                {editingSite
                  ? lang === 'hi'
                    ? `साइट संपादित करें (${editingSite.name})`
                    : `Edit Site: ${editingSite.name}`
                  : lang === 'hi'
                  ? 'नई निर्माण साइट जोड़ें'
                  : 'Add New Construction Site'}
              </span>
            </h3>
            {editingSite && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'रद्द करें' : 'Cancel Edit'}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                labelHi="साइट का नाम *"
                labelEn="Site Name *"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === 'hi' ? 'उदा. बाईपास पेवर ब्लॉक प्रोजेक्ट' : 'e.g. Ring Road Project'}
              />
              <FormField
                labelHi="वर्क ऑर्डर / टेंडर नंबर *"
                labelEn="Work Order No *"
                required
                value={workOrderNo}
                onChange={(e) => setWorkOrderNo(e.target.value)}
                placeholder="WO-2026/894"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                labelHi="विभाग / क्लाइंट"
                labelEn="Department / Client"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="PWD / NHAI / JDA"
              />
              <FormField
                labelHi="अनुबंध मूल्य (₹)"
                labelEn="Order Value (₹)"
                type="number"
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                placeholder="1000000"
              />
              <FormField
                labelHi="साइट लोकेशन (शहर / जिला)"
                labelEn="Location / City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jaipur / Ajmer Road"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={saving}
                icon={editingSite ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              >
                <span>
                  {editingSite
                    ? lang === 'hi'
                      ? 'अपडेट करें'
                      : 'Update Site'
                    : lang === 'hi'
                    ? 'साइट सुरक्षित करें'
                    : 'Save Site'}
                </span>
              </Button>
            </div>
          </form>
        </div>

        {/* 2. Existing Sites List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {lang === 'hi' ? `मौजूदा साइट्स (${sites.length})` : `Existing Sites (${sites.length})`}
            </h4>
            <span className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'एडिट या डिलीट करने हेतु बटन चुनें' : 'Click buttons to edit or delete'}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-border rounded-lg border border-border bg-page/40">
            {loading ? (
              <div className="p-4 text-center text-xs text-text-muted">Loading...</div>
            ) : sites.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                {lang === 'hi' ? 'कोई साइट नहीं मिली' : 'No sites found'}
              </div>
            ) : (
              sites.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs hover:bg-surface transition-colors ${
                    editingSite?.id === s.id ? 'bg-brand-subtle/40 border-l-2 border-brand' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary truncate">{s.name}</span>
                      <span className="text-text-muted text-[11px] font-mono">[{s.workOrderNo}]</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-text-muted">
                      <span>{s.department}</span>
                      {s.location && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-text-muted" />
                          <span>{s.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(s)}
                      className="px-2 py-1 text-text-secondary hover:text-brand hover:bg-brand-subtle rounded transition-colors cursor-pointer flex items-center gap-1 text-xs border border-border"
                      title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'एडिट' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === s.id}
                      onClick={() => handleDelete(s.id, s.name)}
                      className="px-2 py-1 text-danger hover:bg-danger-bg rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 font-medium text-xs border border-danger/20"
                      title={lang === 'hi' ? 'हटाएं' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'हटाएं' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-border flex justify-end">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SiteManageModal;
