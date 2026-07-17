import { useState } from "react";
import { QrCode, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QRCodeCardProps {
  verificationUrl: string;
  verificationCode: string;
}

export function QRCodeCard({ verificationUrl, verificationCode: _verificationCode }: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div className="p-5 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-blue-500" />
        <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider">
          Certificate Verification
        </h4>
      </div>

      <div className="flex flex-col items-center gap-3 p-4">
        <div className="h-40 w-40 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`}
            alt="QR Code for certificate verification"
            className="h-36 w-36 rounded-lg"
            crossOrigin="anonymous"
          />
        </div>

        <p className="text-[10px] text-zinc-500 text-center max-w-xs">
          Scan this QR code to verify the authenticity of this certificate.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-mono text-zinc-500 truncate flex-1">
            {verificationUrl}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy URL
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(verificationUrl, "_blank")}
            className="flex-shrink-0"
            aria-label="Open verification link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
