'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Trash2, AlertTriangle, Building2, Phone, MapPin, X } from 'lucide-react';

export interface PartyItem {
  id: string;
  name: string;
  nameHindi?: string | null;
  type: 'CLIENT' | 'SUPPLIER' | 'SUB_CONTRACTOR' | 'OTHER';
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
}

export interface PartyManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'CLIENT' | 'SUPPLIER' | 'SUB_CONTRACTOR' | 'OTHER';
  onPartyCreated?: (party: PartyItem) => void;
  onPartyUpdated?: (party: PartyItem) => void;
  onPartyDeleted?: (partyId: string) => void;
}

export const PartyManageModal: React.FC<PartyManageModalProps> = ({
  isOpen,
  onClose,
  type,
  onPartyCreated,
  onPartyUpdated,
  onPartyDeleted,
}) => {
  const { lang, t } = useLanguage();
  const toast = useToast();

  const [parties, setParties] = useState<PartyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form state
  const [editingParty, setEditingParty] = useState<PartyItem | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const typeLabels = {
    SUPPLIER: {
      en: 'Supplier',
      hi: 'सप्लायर',
      pluralEn: 'Suppliers',
      pluralHi: 'सप्लायर्स',
    },
    CLIENT: {
      en: 'Customer / Client',
      hi: 'ग्राहक / पार्टी',
      pluralEn: 'Customers',
      pluralHi: 'ग्राहक',
    },
    SUB_CONTRACTOR: {
      en: 'Sub-Contractor',
      hi: 'सब-कॉन्ट्रैक्टर',
      pluralEn: 'Sub-Contractors',
      pluralHi: 'सब-कॉन्ट्रैक्टर्स',
    },
    OTHER: {
      en: 'Party',
      hi: 'पार्टी',
      pluralEn: 'Parties',
      pluralHi: 'पार्टियां',
    },
  }[type];

  // Fetch parties of this type
  const fetchParties = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/parties?type=${type}`, {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setParties(json.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (isOpen) {
      fetchParties();
      handleResetForm();
    }
  }, [isOpen, fetchParties]);

  const handleResetForm = () => {
    setEditingParty(null);
    setName('');
    setPhone('');
    setAddress('');
    setGstin('');
    setErrorMsg('');
  };

  const handleStartEdit = (p: PartyItem) => {
    setEditingParty(p);
    setName(p.name);
    setPhone(p.phone || '');
    setAddress(p.address || '');
    setGstin(p.gstin || '');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg(
        lang === 'hi'
          ? 'नाम कम से कम 2 अक्षरों का होना चाहिए।'
          : 'Name must be at least 2 characters.'
      );
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        name: name.trim(),
        nameHindi: null,
        type,
        phone: phone.trim() || null,
        address: address.trim() || null,
        gstin: gstin.trim() || null,
      };

      if (editingParty) {
        // UPDATE
        const res = await fetch(`/api/parties/${editingParty.id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          toast.success(
            lang === 'hi' ? `${typeLabels.hi} अपडेट हो गया!` : `${typeLabels.en} updated successfully!`,
            name.trim()
          );
          if (onPartyUpdated) onPartyUpdated(json.data);
          handleResetForm();
          await fetchParties();
        } else {
          setErrorMsg(json.message || 'Failed to update party');
        }
      } else {
        // CREATE
        const res = await fetch('/api/parties', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          toast.success(
            lang === 'hi' ? `नया ${typeLabels.hi} सफलतापूर्वक जोड़ा गया!` : `${typeLabels.en} created successfully!`,
            name.trim()
          );
          if (onPartyCreated) onPartyCreated(json.data);
          handleResetForm();
          await fetchParties();
        } else {
          setErrorMsg(json.message || 'Failed to create party');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partyId: string, partyName: string) => {
    setDeletingId(partyId);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('moldins_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/parties/${partyId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          lang === 'hi' ? `${typeLabels.hi} हटा दिया गया!` : `${typeLabels.en} deleted successfully!`,
          partyName
        );
        if (onPartyDeleted) onPartyDeleted(partyId);
        if (editingParty?.id === partyId) handleResetForm();
        await fetchParties();
      } else {
        setErrorMsg(json.message || 'Failed to delete');
        toast.error(json.message || 'Failed to delete');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        lang === 'hi'
          ? `${typeLabels.pluralHi} प्रबंधित करें (Manage / Add)`
          : `Manage & Add ${typeLabels.pluralEn}`
      }
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Error Alert */}
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
              <Building2 className="w-4 h-4 text-brand" />
              <span>
                {editingParty
                  ? lang === 'hi'
                    ? `${typeLabels.hi} संपादित करें (${editingParty.name})`
                    : `Edit ${typeLabels.en}: ${editingParty.name}`
                  : lang === 'hi'
                  ? `नया ${typeLabels.hi} जोड़ें`
                  : `Add New ${typeLabels.en}`}
              </span>
            </h3>
            {editingParty && (
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
                labelHi={`${typeLabels.hi} का नाम *`}
                labelEn={`${typeLabels.en} Name *`}
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === 'hi' ? 'फर्म या व्यक्ति का नाम' : 'Firm or Contact Name'}
              />
              <FormField
                labelHi="मोबाइल / फोन नंबर"
                labelEn="Phone / Mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                labelHi="GSTIN (वैकल्पिक)"
                labelEn="GSTIN (Optional)"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="23AAAAA0000A1Z5"
              />
              <FormField
                labelHi="पता / लोकेशन (वैकल्पिक)"
                labelEn="Address / Location"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={lang === 'hi' ? 'शहर, पता' : 'City, Site'}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={saving}
                icon={editingParty ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              >
                <span>
                  {editingParty
                    ? lang === 'hi'
                      ? 'अपडेट करें'
                      : 'Update'
                    : lang === 'hi'
                    ? 'सुरक्षित करें'
                    : `Save ${typeLabels.en}`}
                </span>
              </Button>
            </div>
          </form>
        </div>

        {/* 2. Existing Parties List with Edit & Delete */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {lang === 'hi'
                ? `मौजूदा ${typeLabels.pluralHi} (${parties.length})`
                : `Existing ${typeLabels.pluralEn} (${parties.length})`}
            </h4>
            <span className="text-[11px] text-text-muted">
              {lang === 'hi' ? 'संपादन या हटाने के लिए नीचे बटन चुनें' : 'Click buttons to edit or delete'}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-border rounded-lg border border-border bg-page/40">
            {loading ? (
              <div className="p-4 text-center text-xs text-text-muted">Loading...</div>
            ) : parties.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                {lang === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No records found'}
              </div>
            ) : (
              parties.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs hover:bg-surface transition-colors ${
                    editingParty?.id === p.id ? 'bg-brand-subtle/40 border-l-2 border-brand' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-text-muted">
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-text-muted" />
                          <span>{p.phone}</span>
                        </span>
                      )}
                      {p.gstin && <span className="font-mono">GST: {p.gstin}</span>}
                      {p.address && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-text-muted" />
                          <span>{p.address}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(p)}
                      className="px-2 py-1 text-text-secondary hover:text-brand hover:bg-brand-subtle rounded transition-colors cursor-pointer flex items-center gap-1 text-xs border border-border"
                      title={lang === 'hi' ? 'संपादित करें' : 'Edit'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'एडिट' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p.id, p.name)}
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

export default PartyManageModal;
