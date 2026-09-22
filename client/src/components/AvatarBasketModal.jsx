import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Check,
  Loader2,
  Image as ImageIcon,
  Camera,
  Layers,
} from 'lucide-react';
import { AVATARS, AVATAR_CATEGORIES } from '../constants/avatars';
import { useToast } from '../context/ToastContext';

export default function AvatarBasketModal({ isOpen, onClose, currentAvatar, onSelectAvatar }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [customPreview, setCustomPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  // Process and compress uploaded image file to lightweight Base64 data URL
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP, or GIF)', 'Invalid File');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize onto a 300x300 canvas for fast loading & compact storage
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCustomPreview(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomPhoto = async () => {
    if (!customPreview) return;
    setLoading(true);
    try {
      await onSelectAvatar(customPreview, 'Custom Upload');
      toast.success('Custom profile picture updated successfully!', 'Avatar Updated');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to apply photo', 'Upload Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCuratedAvatar = async (av) => {
    setLoading(true);
    try {
      await onSelectAvatar(av.url, av.name);
      toast.success(`Profile avatar changed to ${av.name}!`, 'Avatar Updated');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to apply avatar', 'Update Error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAvatars =
    selectedCategory === 'All'
      ? AVATARS
      : AVATARS.filter((av) => av.category === selectedCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-900/40 via-indigo-950/40 to-slate-900 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Avatar Basket</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {AVATARS.length}+ Choices
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose a curated avatar or upload a picture directly from your computer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 pr-3">
          {/* SECTION 1: Upload from Computer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase">
              <Upload className="w-4 h-4 text-brand-400" />
              <span>Upload From Your Computer</span>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
                dragActive
                  ? 'border-brand-400 bg-brand-500/10'
                  : 'border-white/10 hover:border-brand-500/40 bg-slate-900/60 hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex items-center gap-4">
                {customPreview ? (
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-brand-500 shadow-md flex-shrink-0">
                    <img
                      src={customPreview}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                )}

                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">
                    {customPreview ? 'Custom image loaded' : 'Click to browse or drag & drop'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, WEBP, or GIF (up to 5MB)
                  </p>
                </div>
              </div>

              {customPreview ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyCustomPhoto();
                  }}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Apply Photo</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
                >
                  Choose File
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0f172a] px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Or Choose Curated Avatar
            </span>
          </div>

          {/* SECTION 2: Curated Avatars */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Curated Character Gallery</span>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {AVATAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-brand-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
              {filteredAvatars.map((av) => {
                const isCurrent = currentAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectCuratedAvatar(av)}
                    disabled={loading}
                    title={av.name}
                    className={`group relative flex flex-col items-center p-2 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-brand-500/20 border-brand-500 ring-2 ring-brand-500/50 shadow-lg shadow-brand-500/20'
                        : 'bg-slate-900/80 border-white/5 hover:border-brand-500/40 hover:bg-slate-800'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-400 text-slate-950 flex items-center justify-center shadow-md z-10">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-white/10 mb-1.5">
                      <img
                        src={av.url}
                        alt={av.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(av.name)}`;
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>

                    <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white truncate w-full">
                      {av.iconEmoji} {av.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Click any avatar for 1-click update</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
