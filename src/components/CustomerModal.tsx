import React, { useState, useEffect, useRef } from 'react';
import { X, Check, User, Phone, Image, MapPin, Upload, Loader2 } from 'lucide-react';
import { Customer } from '../types';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'createdAt'>) => void;
  initialCustomer?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCustomer,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [address, setAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCustomer) {
      setName(initialCustomer.name || '');
      setPhone(initialCustomer.phone || '');
      setPhoto(initialCustomer.photo || '');
      setAddress(initialCustomer.address || '');
    } else {
      setName('');
      setPhone('');
      setPhoto('');
      setAddress('');
    }
    setUploadError(null);
  }, [initialCustomer, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(t('chooseImageError'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('imageTooLarge'));
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadPhoto(file);
      setPhoto(res.data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('uploadFailed'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('fillCustomerName'));
      return;
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
      photo,
      address: address.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {initialCustomer ? t('editCustomer') : t('addCustomer')}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">{t('customersSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-705 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('contactName')} <span className="text-rose-455">*</span></span>
            </label>
            <input
              type="text"
              placeholder="Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-705 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('phone')}</span>
            </label>
            <input
              type="text"
              placeholder="+1 (555) 019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-905 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-semibold transition-all"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-bold text-slate-705 mb-2 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('photo')}</span>
            </label>

            {photo ? (
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-205">
                <img
                  src={photo}
                  alt={t('customerLabel')}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
                  >
                    {t('changePhoto')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-transparent text-xs font-semibold transition-all"
                  >
                    {t('removePhoto')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2.5 p-5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-250 rounded-xl transition-all text-xs font-semibold text-slate-500 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>{t('uploading')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>{t('uploadPhoto')}</span>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {uploadError && (
              <p className="mt-2 text-[11px] text-rose-600 font-medium">{uploadError}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-750 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('address')}</span>
            </label>
            <textarea
              rows={2}
              placeholder={t('addressPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Footer buttons */}
          <div className="sticky bottom-0 z-10 bg-white pt-4 pb-1 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-slate-200 flex items-center justify-end gap-3 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{initialCustomer ? t('editCustomer') : t('addCustomer')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
