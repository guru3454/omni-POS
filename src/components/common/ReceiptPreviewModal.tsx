import React from 'react';
import { X, Printer, CheckCircle2, QrCode } from 'lucide-react';

interface ReceiptPreviewModalProps {
  receiptText: string;
  qrCodeUrl?: string;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  receiptText,
  qrCodeUrl,
  onClose,
}) => {
  const handlePrint = () => {
    // Open a print window or trigger print
    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (printWin) {
      printWin.document.write(`
        <html>
          <head>
            <title>ESC/POS Receipt</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 10px; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <pre>${receiptText}</pre>
          </body>
        </html>
      `);
      printWin.document.close();
      printWin.focus();
      printWin.print();
      printWin.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Printer className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">80mm Thermal Receipt</h3>
              <p className="text-[11px] text-slate-500">ESC/POS Fiscal Docket Preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Simulation Canvas */}
        <div className="p-6 bg-slate-100/70 flex flex-col items-center justify-center overflow-y-auto max-h-[70vh]">
          <div className="w-full max-w-xs bg-white text-slate-900 p-5 rounded-2xl shadow-md font-mono text-[11px] leading-relaxed border border-slate-200">
            <pre className="whitespace-pre-wrap font-mono select-all overflow-x-auto font-medium text-slate-800">{receiptText}</pre>

            {/* Simulated QR Code */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-1.5">
              <div className="w-20 h-20 bg-slate-900 text-white flex items-center justify-center rounded-xl p-2 shadow-xs">
                <QrCode className="w-16 h-16 text-emerald-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                Scan to Verify eTIMS / KRA Fiscal Invoice
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Send ESC/POS Pulse</span>
          </button>
        </div>
      </div>
    </div>
  );
};

