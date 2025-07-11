import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Upload, X, File } from 'lucide-react';

export interface FileUploadProps {
  label?: string;
  description?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  value?: File | File[];
  onChange?: (files: File | File[] | null) => void;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  dragAndDrop?: boolean;
  showPreview?: boolean;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    label,
    description,
    error,
    accept,
    multiple = false,
    maxSize,
    maxFiles,
    value,
    onChange,
    disabled = false,
    className,
    containerClassName,
    dragAndDrop = true,
    showPreview = true,
    ...props 
  }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const uploadId = `upload-${Math.random().toString(36).substr(2, 9)}`;

    // Normalize value to always be an array for easier handling
    const files = multiple 
      ? (Array.isArray(value) ? value : value ? [value] : [])
      : (value ? [value as File] : []);

    const handleFileChange = (newFiles: FileList | null) => {
      if (!newFiles || newFiles.length === 0) return;

      const fileArray = Array.from(newFiles);
      let validFiles = fileArray;

      // Filter by size
      if (maxSize) {
        validFiles = validFiles.filter(file => file.size <= maxSize);
      }

      // Limit number of files
      if (maxFiles && validFiles.length > maxFiles) {
        validFiles = validFiles.slice(0, maxFiles);
      }

      if (validFiles.length > 0) {
        if (multiple) {
          onChange?.(validFiles);
        } else {
          onChange?.(validFiles[0]);
        }
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e.target.files);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!disabled) {
        handleFileChange(e.dataTransfer.files);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const removeFile = (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      if (multiple) {
        onChange?.(newFiles.length > 0 ? newFiles : null);
      } else {
        onChange?.(null);
      }
    };

    const openFileDialog = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label
            htmlFor={uploadId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer",
            error && "border-destructive",
            className
          )}
          onClick={openFileDialog}
          onDrop={dragAndDrop ? handleDrop : undefined}
          onDragOver={dragAndDrop ? handleDragOver : undefined}
          onDragLeave={dragAndDrop ? handleDragLeave : undefined}
        >
          <input
            ref={ref || inputRef}
            id={uploadId}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={disabled}
            className="sr-only"
            aria-describedby={description ? `${uploadId}-description` : undefined}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />

          <div className="flex flex-col items-center justify-center text-center">
            <Upload className={cn(
              "h-8 w-8 mb-2",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="text-sm font-medium">
              {isDragOver 
                ? "Drop files here" 
                : "Click to upload or drag and drop"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {accept && `Accepted formats: ${accept}`}
              {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
              {maxFiles && ` • Max files: ${maxFiles}`}
            </p>
          </div>
        </div>

        {/* File preview */}
        {showPreview && files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 hover:bg-background rounded-sm"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {description && (
          <p
            id={`${uploadId}-description`}
            className={cn(
              "text-xs text-muted-foreground",
              error && "text-destructive"
            )}
          >
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export default FileUpload;
