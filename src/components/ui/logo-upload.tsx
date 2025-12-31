'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { VendorLogo } from './vendor-logo';

interface LogoUploadProps {
  currentLogo?: string | null;
  businessName: string;
  vendorId?: string;
  onUploadComplete?: (logoUrl: string) => void;
  onRemoveComplete?: () => void;
  disabled?: boolean;
  size?: 'md' | 'lg';
}

const MAX_SIZE_MB = 5;
const MAX_DIMENSION = 400; // Resize to max 400x400

export function LogoUpload({
  currentLogo,
  businessName,
  vendorId,
  onUploadComplete,
  onRemoveComplete,
  disabled = false,
  size = 'lg',
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to resize image'));
              }
            },
            'image/jpeg',
            0.9
          );
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB`);
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Resize image
      const resizedBlob = await resizeImage(file);

      // Create form data
      const formData = new FormData();
      formData.append('file', resizedBlob, `logo.jpg`);
      if (vendorId) {
        formData.append('vendorId', vendorId);
      }

      // Upload
      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Clear preview and call callback
      setPreviewUrl(null);
      onUploadComplete?.(data.logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentLogo) return;

    try {
      setRemoving(true);
      setError(null);

      const url = vendorId
        ? `/api/upload/logo?vendorId=${vendorId}`
        : '/api/upload/logo';

      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove logo');
      }

      onRemoveComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo');
    } finally {
      setRemoving(false);
    }
  };

  const displayLogo = previewUrl || currentLogo;
  const isLoading = uploading || removing;
  const logoSize = size === 'lg' ? 'xl' : 'lg';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Logo Display */}
      <div className="relative group">
        <div
          className={cn(
            'relative rounded-full overflow-hidden',
            size === 'lg' ? 'w-20 h-20' : 'w-16 h-16',
            isLoading && 'opacity-50'
          )}
        >
          <VendorLogo
            src={displayLogo}
            businessName={businessName}
            size={logoSize}
          />

          {/* Overlay for upload */}
          {!disabled && !isLoading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'absolute inset-0 bg-black/50 flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
              )}
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Remove button */}
        {currentLogo && !disabled && !isLoading && (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'absolute -top-1 -right-1 p-1 rounded-full',
              'bg-red-500 text-white hover:bg-red-600',
              'shadow-md transition-colors'
            )}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isLoading}
      />

      {/* Upload button */}
      {!disabled && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={cn(
            'text-sm text-brand-600 hover:text-brand-700',
            'flex items-center gap-1.5',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Upload className="w-4 h-4" />
          {currentLogo ? 'Change Logo' : 'Upload Logo'}
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Help text */}
      {!disabled && !error && (
        <p className="text-xs text-gray-400 text-center">
          JPEG, PNG, WebP or GIF. Max {MAX_SIZE_MB}MB.
        </p>
      )}
    </div>
  );
}
