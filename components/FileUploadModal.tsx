'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Lock,
  Loader2,
  HardDrive,
  ShieldAlert
} from 'lucide-react';
import { useManagementStore } from '@/stores/useManagementStore';
import { AttachedDocument, DocumentCategory } from '@/types';
import {
  uploadDocument,
  validateFile,
  formatFileSize,
  canUserUpload,
  MAX_FILE_SIZE_BYTES
} from '@/lib/storageService';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'Client' | 'Incident' | 'BillingClaim' | 'BSPDocument' | 'General';
  entityId: string;
  entityName?: string;
  defaultCategory?: AttachedDocument['category'];
  onUploadSuccess?: (doc: AttachedDocument) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  defaultCategory = 'other',
  onUploadSuccess
}) => {
  const { currentUser, addAuditLog } = useManagementStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [category, setCategory] = useState<AttachedDocument['category']>(defaultCategory);
  const [description, setDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<AttachedDocument | null>(null);

  if (!isOpen) return null;

  const isUserAllowed = canUserUpload(currentUser);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setUploadedDoc(null);

    const validation = validateFile({
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!documentName) {
      // Set default name without extension
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setDocumentName(baseName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    if (!isUserAllowed) {
      setErrorMessage(`User role "${currentUser?.role}" is not permitted to upload document attachments.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      const result = await uploadDocument({
        file: selectedFile,
        fileName: documentName.trim() ? `${documentName.trim()}.${selectedFile.name.split('.').pop()}` : selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        sizeBytes: selectedFile.size,
        category,
        entityType,
        entityId,
        user: currentUser,
        description: description.trim() || undefined,
        onProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      setUploadedDoc(result);
      addAuditLog(
        'UPLOAD_DOCUMENT',
        entityType,
        entityId,
        `Uploaded document "${result.name}" (${formatFileSize(result.sizeBytes)}) category: ${category}`
      );

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err: any) {
      console.error('Upload failure:', err);
      setErrorMessage(err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDescription('');
    setCategory(defaultCategory);
    setErrorMessage(null);
    setUploadedDoc(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Attach Document</h3>
              <p className="text-xs text-slate-400">
                {entityName ? `${entityType}: ${entityName}` : `Attach file to ${entityType}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* RBAC Warning if unauthorized */}
          {!isUserAllowed && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Read-Only Access</span>
                <p className="text-slate-300 mt-1">
                  Your current user role ({currentUser?.role}) has read-only access and cannot upload documents. Only Practitioners and Admins can attach records.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {uploadedDoc ? (
            /* Upload Success View */
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">File Attached Successfully!</h4>
                <p className="text-xs text-slate-300 mt-1">{uploadedDoc.name}</p>
                <span className="inline-block mt-2 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                  {formatFileSize(uploadedDoc.sizeBytes)} • {uploadedDoc.category}
                </span>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={resetState}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
                >
                  Upload Another
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Upload Form View */
            <>
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && isUserAllowed && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-teal-400 bg-teal-500/10'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-slate-700 hover:border-teal-500/50 bg-slate-950/40 hover:bg-slate-950/60'
                } ${!isUserAllowed || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                  disabled={!isUserAllowed || isUploading}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-white text-sm truncate max-w-xs">{selectedFile.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{formatFileSize(selectedFile.size)}</span>
                    <span className="text-[10px] text-teal-400 hover:underline mt-1">Click to replace file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-200">
                      Drag and drop your file here, or <span className="text-teal-400">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports PDF, DOCX, JPEG, PNG (Max 25 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Document Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Document Title / Label
                  </label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g. NDIS Consent Form 2026"
                    disabled={!isUserAllowed || isUploading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Document Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AttachedDocument['category'])}
                    disabled={!isUserAllowed || isUploading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="consent">Consent Form (Signed)</option>
                    <option value="assessment">Clinical Assessment PDF</option>
                    <option value="bsp">Behaviour Support Plan (BSP)</option>
                    <option value="incident_photo">Incident Photo / Evidence</option>
                    <option value="other">General Attachment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Clinical Notes / Description <span className="text-slate-500">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add brief notes regarding this document..."
                    disabled={!isUserAllowed || isUploading}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>
              </div>

              {/* Progress Bar during Upload */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                      Uploading to Firebase Storage...
                    </span>
                    <span className="font-mono text-teal-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!uploadedDoc && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Lock className="w-3 h-3 text-teal-400" />
              <span>RBAC Protected Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || !isUserAllowed || isUploading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-xs font-bold text-white shadow-lg shadow-teal-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
