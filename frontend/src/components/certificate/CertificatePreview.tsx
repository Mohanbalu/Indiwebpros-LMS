import { useState, useCallback, useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut, Download, Printer, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDownloadCertificate } from "@/hooks/useCertificate";

interface CertificatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string;
  downloadUrl: string | null;
  title: string;
}

export function CertificatePreview({
  isOpen,
  onClose,
  certificateId,
  downloadUrl,
  title,
}: CertificatePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const downloadMutation = useDownloadCertificate();

  const handleDownload = useCallback(async () => {
    if (downloadMutation.isPending) return;
    try {
      const { url } = await downloadMutation.mutateAsync(certificateId);
      if (url) {
        window.open(url, "_blank");
      }
    } catch { /* noop */ }
  }, [certificateId, downloadMutation]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = useCallback(() => {
    if (!downloadUrl) return;
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    } else {
      const printWindow = window.open(downloadUrl, "_blank");
      if (printWindow) {
        printWindow.print();
      }
    }
  }, [downloadUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <span className="h-4 w-px bg-zinc-800" />
          <h3 className="text-sm font-bold text-zinc-200 truncate max-w-md">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            disabled={zoom <= 25}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold text-zinc-400 w-10 text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            disabled={zoom >= 200}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <span className="h-4 w-px bg-zinc-800 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            disabled={!downloadUrl}
            aria-label="Print certificate"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
            aria-label="Download certificate"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-8">
        <div
          className="transition-all duration-200"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          {downloadUrl ? (
            <iframe
              ref={iframeRef}
              src={downloadUrl}
              className="w-[210mm] h-[297mm] rounded-xl shadow-2xl bg-white"
              title="Certificate preview"
              style={{ border: "none" }}
            />
          ) : (
            <div className="w-[210mm] h-[297mm] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <p className="text-sm text-zinc-500">Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
