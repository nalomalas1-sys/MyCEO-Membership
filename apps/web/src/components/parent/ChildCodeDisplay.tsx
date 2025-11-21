import { useState } from 'react';
import { QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface ChildCodeDisplayProps {
  code: string;
  childName: string;
}

export function ChildCodeDisplay({ code, childName }: ChildCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(dataUrl);
      setShowQR(true);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200 rounded-lg p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {childName}'s Access Code
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Your child can use this code to log in to their dashboard
        </p>
      </div>

      <div className="text-center mb-4">
        <div className="inline-block bg-white p-4 rounded-lg border-2 border-primary-300 shadow-lg">
          <div className="text-4xl font-mono font-bold text-primary-900 mb-2" style={{ letterSpacing: '0.2em' }}>
            {code}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={copyToClipboard}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-600">Copy Code</span>
            </>
          )}
        </button>

        <button
          onClick={generateQRCode}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
        >
          <QrCode className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </span>
        </button>
      </div>

      {showQR && qrCodeDataUrl && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-primary-300">
            <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
            <p className="text-xs text-center text-gray-600 mt-2">
              Scan this code to quickly access the login page
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800 text-center">
          <strong>Important:</strong> Save this code in a safe place. Your child will need it every time they log in.
        </p>
      </div>
    </div>
  );
}





