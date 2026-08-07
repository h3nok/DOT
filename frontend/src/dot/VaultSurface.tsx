import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle,
    FileText,
    Loader2,
    Upload,
    X,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useOrganismPulse } from "../organism";
import { BloomSurface } from "./BloomSurface";
import { api, ORCHESTRATOR_BASE } from "./orchestrator";

export interface SelectedFile {
  id: string;
  file: File;
  status: "ready" | "uploading" | "success" | "error";
  error?: string;
  url?: string;
  /** What the twin could make of the file: "ready", "unsupported", "failed". */
  ingest?: string;
  /** How many passages the twin can now cite from it. */
  passages?: number;
}

interface VaultSurfaceProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Stored and readable are different outcomes. A file the twin cannot parse is
 * kept safely and still cannot be cited, and saying "Ready" for both is how a
 * member ends up asking about a document the twin has never read.
 */
const IngestNote: React.FC<{ ingest?: string; passages?: number }> = ({
  ingest,
  passages,
}) => {
  if (ingest === "unsupported") {
    return (
      <span className="font-medium text-muted-foreground">
        Stored — not readable yet
      </span>
    );
  }
  if (ingest === "failed") {
    return (
      <span className="font-medium text-destructive/90">
        Stored — could not be read
      </span>
    );
  }
  return (
    <span className="font-medium text-[color:var(--organism-accent-strong)]">
      {passages ? `Readable — ${passages} passages` : "Readable"}
    </span>
  );
};

export const VaultSurface: React.FC<VaultSurfaceProps> = ({
  origin,
  reducedMotion = false,
  onClose,
}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const pulse = useOrganismPulse();

  const uploadFile = async (fileRec: SelectedFile) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileRec.id ? { ...f, status: "uploading" } : f,
        ),
      );

      // 1. Get presigned URL. The session identifies the owner; the upload is
      // written under that owner's prefix and nowhere else.
      const urlRes = await api<{ url: string; key: string }>(
        "/v1/vault/upload-url",
        {
          method: "POST",
          body: {
            filename: fileRec.file.name,
            content_type: fileRec.file.type,
            size: fileRec.file.size,
          },
        },
      );

      if (!urlRes.ok || !urlRes.data)
        throw new Error("Failed to get upload URL");
      const urlData = urlRes.data;

      // 2. PUT file to object store proxy
      const putRes = await fetch(`${ORCHESTRATOR_BASE}${urlData.url}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: fileRec.file,
      });

      if (!putRes.ok) throw new Error("Failed to upload file");

      // 3. Register node. The response carries what ingest made of the file,
      // so the queue can report readability rather than just "uploaded".
      const nodeRes = await api<{
        properties?: { ingest_status?: string; chunk_count?: number } | null;
      }>("/v1/vault/nodes", {
        method: "POST",
        body: { key: urlData.key, filename: fileRec.file.name },
      });

      const properties = nodeRes.data?.properties ?? {};
      pulse(1); // The organism feels the new knowledge
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileRec.id
            ? {
                ...f,
                status: "success",
                ingest: properties.ingest_status,
                passages: properties.chunk_count,
              }
            : f,
        ),
      );
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileRec.id
            ? { ...f, status: "error", error: err.message }
            : f,
        ),
      );
    }
  };

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: "ready" as const,
    }));

    setFiles((prev) => [...newFiles, ...prev]);

    // Trigger uploads
    newFiles.forEach((file) => uploadFile(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
  });

  const StatusIcon = ({ status }: { status: SelectedFile["status"] }) => {
    switch (status) {
      case "uploading":
        return (
          <Loader2 className="h-4 w-4 text-[color:var(--organism-accent-soft)] animate-spin" />
        );
      case "success":
        return (
          <CheckCircle className="h-4 w-4 text-[color:var(--organism-accent-strong)]" />
        );
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground/60" />;
    }
  };

  return (
    <BloomSurface
      kicker="knowledge vault"
      title="The Vault"
      description="Upload what you know. Whatever Lumen can read becomes something it can cite."
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={55}
      size="lg"
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed px-8 py-10 transition-colors cursor-pointer ${
            isDragActive
              ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.05]"
              : "border-border/30 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
          }`}
        >
          <input {...getInputProps()} />
          <div
            className={`z-10 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
              isDragActive
                ? "border border-[color:var(--organism-accent-soft)]/30 bg-[color:var(--organism-accent-soft)]/20 text-[color:var(--organism-accent-strong)]"
                : "border border-transparent bg-muted/60 text-muted-foreground/70"
            }`}
          >
            <Upload className="h-5 w-5" />
          </div>
          <div className="z-10 space-y-1 text-center">
            <p className="text-sm font-semibold text-foreground">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or{" "}
              <span className="font-medium text-[color:var(--organism-accent-soft)] hover:underline">
                browse
              </span>{" "}
              to select from your device
            </p>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Ingestion Queue
            </h3>
            <AnimatePresence mode="popLayout">
              {files.map((f, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.15 },
                  }}
                  key={f.id}
                  className={`group relative flex overflow-hidden items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors ${
                    f.status === "error"
                      ? "border-destructive/30 bg-destructive/5"
                      : f.status === "success"
                        ? "border-[color:var(--organism-accent-soft)]/30 bg-[color:var(--organism-accent-soft)]/5"
                        : "border-border/40 bg-card/80 hover:bg-card"
                  }`}
                >
                  {f.status === "uploading" && (
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }}
                      className="absolute bottom-0 left-0 h-[2px] bg-[color:var(--organism-accent-soft)]/50"
                    />
                  )}

                  <div className="relative z-10">
                    <StatusIcon status={f.status} />
                  </div>

                  <div className="relative z-10 min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {f.file.name}
                    </p>
                    {f.error ? (
                      <p className="mt-0.5 text-xs font-medium text-destructive/90">
                        {f.error}
                      </p>
                    ) : (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {formatFileSize(f.file.size)}
                        <span className="opacity-40">•</span>
                        {f.status === "uploading" ? (
                          <span className="animate-pulse font-medium text-[color:var(--organism-accent-soft)]">
                            Reading...
                          </span>
                        ) : f.status === "success" ? (
                          <IngestNote ingest={f.ingest} passages={f.passages} />
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wider">
                            {f.file.name.split(".").pop()}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {f.status !== "uploading" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiles((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="relative z-10 rounded-md p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </BloomSurface>
  );
};

export default VaultSurface;
