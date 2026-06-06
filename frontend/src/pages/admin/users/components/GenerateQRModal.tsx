import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, Download, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  guardName: string;
  isLoading?: boolean;
}

export default function GenerateQRModal({ isOpen, onClose, url, guardName, isLoading = false }: QRModalProps) {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const loading = isLoading || !url;
  const displayUrl = getCompactRegistrationUrl(url);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadQR = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const urlBlob = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(urlBlob);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr_${guardName.replace(/\s+/g, "_")}.png`;
      link.href = pngUrl;
      link.click();
    };

    img.src = urlBlob;
  };

  if (!isOpen) return null;

  return (
    <div className="pz-user-modal-overlay">
      <div className="pz-user-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
        <div className="pz-user-modal-head">
          <div className="pz-user-modal-title-row">
            <div className="pz-user-modal-icon">
              <QrCode size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="pz-user-modal-title" id="qr-modal-title">
                Register Device via QR
              </h2>
              <div className="pz-user-modal-subtitle">For {guardName}. Scan or copy the secure device link.</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-user-modal-close" aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="pz-user-modal-body">
          {loading ? (
            <div className="pz-qr-skeleton" aria-label="Preparing QR code">
              <div className="pz-qr-skeleton-box">
                <QrCode size={54} aria-hidden="true" />
              </div>
              <div className="pz-qr-skeleton-button" />
              <div className="pz-qr-skeleton-link">
                <span />
                <span />
              </div>
              <div className="pz-qr-skeleton-button primary" />
            </div>
          ) : (
            <div className="pz-qr-panel">
              <div className="pz-qr-box">
                <QRCodeSVG value={url} size={190} ref={svgRef} />
              </div>
              <button type="button" onClick={downloadQR} className="pz-users-button">
                <Download size={15} aria-hidden="true" />
                Download PNG
              </button>
              <div className="pz-qr-link" title={url}>{displayUrl}</div>
              <button type="button" onClick={handleCopy} className="pz-users-button primary">
                {copied ? <Check size={15} aria-hidden="true" /> : <Clipboard size={15} aria-hidden="true" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          )}
        </div>

        <div className="pz-user-modal-footer">
          <button type="button" onClick={onClose} className="pz-users-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function getCompactRegistrationUrl(url: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const guardId = parsed.searchParams.get("g") || parsed.searchParams.get("guardId");
    const token = parsed.searchParams.get("t") || parsed.searchParams.get("token");
    const compactToken = token && token.length > 24 ? `${token.slice(0, 14)}...${token.slice(-8)}` : token;
    const compactQuery = [
      guardId ? `g=${guardId}` : "",
      compactToken ? `t=${compactToken}` : "",
    ].filter(Boolean).join("&");

    return `${parsed.origin}${parsed.pathname}${compactQuery ? `?${compactQuery}` : ""}`;
  } catch {
    return url.length > 52 ? `${url.slice(0, 34)}...${url.slice(-14)}` : url;
  }
}
