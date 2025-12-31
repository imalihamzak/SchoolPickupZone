'use client';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { LAN_API_BASE } from '@/lib/api/link';
import { toast } from 'react-toastify';

export default function PickupScanner() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Page load spinner
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1000); // smooth load
    return () => clearTimeout(timer);
  }, []);

  // QR detection from camera
  useEffect(() => {
    const interval = setInterval(() => {
      if (!scanning || !webcamRef.current || !canvasRef.current) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      if (!video || video.readyState !== 4) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode?.data) {
        handleQRScan(qrCode.data);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [scanning]);

  // QR scan handler
  const handleQRScan = async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      const fingerprint = await getFingerprint();
      const userAgent = navigator.userAgent;

      const response = await fetch(`${LAN_API_BASE}/pickups/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrData: parsed,
          device_fingerprint: fingerprint,
          user_agent: userAgent
        })
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || 'Pickup failed');
      } else {
        toast.success(result.message || 'Pickup successful');
      }

      setScanning(false);
    } catch (err) {
      console.error(err);
      toast.error('Invalid QR code or network error');
    } finally {
      setUploading(false);
    }
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setUploading(false);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode?.data) {
        handleQRScan(qrCode.data);
      } else {
        toast.error('No QR code found in the image.');
        setUploading(false);
      }

      // Fix: allow re-upload of the same file
      event.target.value = '';
    };
  };

  // Utility: fingerprint
  async function getFingerprint() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }

  if (pageLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md text-center relative z-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📷 Scan Your QR Code</h2>
        <p className="text-sm text-gray-500 mb-4">
          Align your QR in front of the camera or upload an image.
        </p>

        {scanning && (
          <>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="rounded-md border w-full"
              videoConstraints={{ facingMode: 'environment' }}
            />
            <canvas ref={canvasRef} hidden />
          </>
        )}

        {!scanning && (
          <button
            onClick={() => setScanning(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Scan Again
          </button>
        )}

        <div className="mt-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="text-sm"
          />
        </div>
      </div>

      {/* Overlay loader during image scan */}
      {uploading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-2xl">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-blue-700 font-medium">Scanning uploaded image...</p>
        </div>
      )}
    </div>
  );
}
