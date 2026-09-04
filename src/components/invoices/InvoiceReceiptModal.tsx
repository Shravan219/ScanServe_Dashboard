import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, CheckCircle2, RotateCcw, Copy, Check, MessageSquare, FileText } from 'lucide-react';
import { Receipt } from '@/src/components/Receipt';
import { toast } from 'sonner';
import { sendWhatsAppReceiptWithPDF, downloadReceiptPDF } from '@/src/lib/whatsapp';

export interface SavedInvoiceData {
  id: string;
  token?: string;
  customer_name: string;
  customer_phone?: string;
  items: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    item_notes?: string;
  }>;
  subtotal: number;
  tax_amount?: number;
  tax_rate?: number;
  discount?: number;
  total: number;
  payment_mode?: string;
  table_id?: string | number;
  created_at?: string;
  gstin?: string;
}

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SavedInvoiceData | null;
  onResetForm?: () => void;
}

export function InvoiceReceiptModal({
  isOpen,
  onClose,
  invoice,
  onResetForm
}: InvoiceReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!invoice) return;
    const itemsList = invoice.items
      .map(it => `• ${it.name} x${it.quantity} = ₹${(it.price * it.quantity).toFixed(2)}`)
      .join('\n');

    const text = `*VYOMA ARTISAN CAFE - INVOICE*
Invoice: ${invoice.id} (${invoice.token || 'N/A'})
Date: ${new Date(invoice.created_at || Date.now()).toLocaleString('en-IN')}
Customer: ${invoice.customer_name} (${invoice.customer_phone || 'N/A'})

*ITEMS:*
${itemsList}

Subtotal: ₹${invoice.subtotal.toFixed(2)}
GST (5%): ₹${(invoice.tax_amount || 0).toFixed(2)}
${invoice.discount ? `Discount: -₹${invoice.discount.toFixed(2)}\n` : ''}*Grand Total: ₹${invoice.total.toFixed(2)}*
Payment: ${invoice.payment_mode || 'UPI'}
Thank you for dining with Vyoma!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invoice summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    toast.info('Preparing print / PDF save dialog...');
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 300);
  };

  const handleSendWhatsApp = async () => {
    if (!invoice) return;
    const phone = invoice.customer_phone;
    if (!phone) {
      toast.error('No customer phone number provided for this invoice');
      return;
    }
    const shareResult = await sendWhatsAppReceiptWithPDF(invoice, phone);
    if (shareResult.nativeShared) {
      toast.success(`PDF receipt shared to ${phone}`);
    } else if (shareResult.pdfDownloaded) {
      toast.success(`PDF downloaded! Opening WhatsApp for ${phone}...`);
    } else if (!shareResult.success) {
      toast.error('Could not send PDF receipt');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0A0A0A] border border-white/10 text-white max-w-[500px] w-full rounded-[2rem] p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-serif text-white tracking-tight">
                Invoice <span className="italic text-primary">Generated</span>
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">
                Direct POS Bill • Token {invoice.token || invoice.id.slice(-4)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Action Header Pills */}
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-3 my-2 text-xs">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">Customer</span>
            <span className="font-semibold text-white">{invoice.customer_name}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">Total Amount</span>
            <span className="font-serif text-lg text-primary font-bold">₹{invoice.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Live Thermal Receipt Canvas */}
        <div className="my-2 border border-white/5 rounded-[1.5rem] bg-zinc-100 p-4 max-h-[340px] overflow-y-auto custom-scrollbar flex justify-center shadow-inner">
          <div className="receipt-print-wrapper" ref={printRef}>
            <Receipt
              orderId={invoice.id}
              table={invoice.table_id?.toString() || 'Walk-in POS'}
              items={invoice.items.map(it => ({
                name: it.name,
                price: it.price,
                quantity: it.quantity
              }))}
              subtotal={invoice.subtotal}
              taxRate={invoice.tax_rate !== undefined ? invoice.tax_rate : 5}
              gstin={invoice.gstin}
              token={invoice.token}
              customerName={invoice.customer_name}
              customerPhone={invoice.customer_phone}
              createdAt={invoice.created_at}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            onClick={handleSendWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-full h-12 text-[10px] uppercase tracking-[0.25em] font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            Send PDF via WhatsApp
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handlePrint}
              className="bg-primary text-black hover:bg-primary/90 rounded-full h-11 text-[10px] uppercase tracking-[0.2em] font-bold shadow-[0_0_20px_rgba(197,160,89,0.25)] flex items-center justify-center gap-2"
            >
              <Printer size={14} />
              Print Receipt
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="border-white/10 text-white/80 hover:text-white hover:border-white/30 rounded-full h-11 text-[10px] uppercase tracking-[0.2em] font-bold bg-white/5 flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Save / PDF
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCopySummary}
            className="w-full sm:w-auto text-white/40 hover:text-white text-[10px] uppercase tracking-wider h-10 flex items-center justify-center gap-1.5"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Text'}
          </Button>

          {onResetForm && (
            <Button
              type="button"
              onClick={() => {
                onResetForm();
                onClose();
              }}
              variant="outline"
              className="w-full sm:w-auto border-primary/20 text-primary hover:bg-primary/10 rounded-full text-[10px] uppercase tracking-wider font-bold h-10 px-5 flex items-center justify-center gap-2 ml-auto"
            >
              <RotateCcw size={13} />
              New Customer Bill
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
