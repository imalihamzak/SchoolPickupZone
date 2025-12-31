import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ClipboardIcon, CheckIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import Loader from '@/components/Loader';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  guardName: string;
}

export default function GenerateQRModal({ isOpen, onClose, url, guardName }: QRModalProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Simulate loading for 1s when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQR = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const urlBlob = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(urlBlob);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qr_${guardName.replace(/\s+/g, '_')}.png`;
      link.href = pngUrl;
      link.click();
    };

    img.src = urlBlob;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Header */}
          <h2 className="text-2xl font-bold text-center mb-2">Register Device via QR</h2>
          <p className="text-center text-sm text-gray-600 mb-4">
            For <strong>{guardName}</strong> – scan or use the link below
          </p>

          {/* QR Code */}
          <div className="flex flex-col items-center mb-4">
            <div className="p-3 border rounded-xl shadow-inner bg-white">
              <QRCodeSVG value={url} size={180} ref={svgRef} />
            </div>
            <button
              onClick={downloadQR}
              className="mt-2 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PNG
            </button>
          </div>

          {/* Link Display + Copy */}
          <div className="text-center mt-4">
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-xs text-gray-600 break-words max-h-24 overflow-y-auto">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className="mt-2 flex items-center gap-2 mx-auto text-indigo-600 hover:text-indigo-800 text-sm"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
