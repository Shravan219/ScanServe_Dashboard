import * as React from 'react';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptProps {
  orderId: string;
  table: string;
  items: OrderItem[];
  subtotal: number;
  gstin?: string;
  taxRate?: number;
  token?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({
  orderId,
  table,
  items,
  subtotal,
  gstin,
  taxRate = 5,
  token,
  customerName,
  customerPhone,
  createdAt
}, ref) => {
  // Current date/time fallback
  const displayDate = React.useMemo(() => {
    if (createdAt) {
      try {
        return new Date(createdAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      } catch (e) {
        return createdAt;
      }
    }
    return new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }, [createdAt]);

  // Calculations for GST compliance
  const hasGstin = !!gstin && gstin.trim().length > 0;
  const computedTaxRate = Number(taxRate);
  const cgstRate = computedTaxRate / 2;
  const sgstRate = computedTaxRate / 2;

  const cgstAmount = hasGstin ? subtotal * (cgstRate / 100) : 0;
  const sgstAmount = hasGstin ? subtotal * (sgstRate / 100) : 0;
  const taxAmount = cgstAmount + sgstAmount;
  const grandTotal = hasGstin ? subtotal + taxAmount : subtotal;

  return (
    <div ref={ref} className="receipt-print-container relative bg-white text-black p-6 font-mono text-xs w-[80mm] mx-auto border border-gray-200 shadow-lg rounded-md select-none print:border-none print:shadow-none print:rounded-none">
      {/* Dynamic Printing Style overrides inside the component */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Setup thermal layout size and eliminate native margin headers/footers */
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          /* Body and HTML print override */
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            font-family: 'Courier New', Courier, monospace !important;
          }

          /* Completely isolate other viewport elements */
          body > *:not(.receipt-print-wrapper) {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          /* Force the specific print wrapper to display fully */
          .receipt-print-wrapper {
            display: block !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Receipt actual viewport rules */
          .receipt-print-container {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 5mm 6mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            float: none !important;
          }

          /* Standardize browser colors */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      ` }} />

      {/* Brand Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold tracking-tight uppercase">ScanServe</h1>
        <p className="text-[9px] uppercase tracking-wider text-gray-500">Contactless Table Ordering</p>
        <p className="text-[10px] text-gray-600 font-bold mt-1">
          {hasGstin ? 'TAX INVOICE' : 'RETAIL BILL'}
        </p>
      </div>

      {/* Metadata section */}
      <div className="border-t border-b border-dashed border-black/40 py-2 my-2 space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Date:</span>
          <span className="font-semibold">{displayDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Order ID:</span>
          <span className="font-semibold text-right break-all">#{orderId.slice(0, 12).toUpperCase()}</span>
        </div>
        {token && (
          <div className="flex justify-between text-xs font-bold">
            <span>Token:</span>
            <span>{token}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Table:</span>
          <span className="font-semibold">Table {table || 'Walk-in'}</span>
        </div>
        {customerName && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{customerName}</span>
          </div>
        )}
        {customerPhone && (
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{customerPhone}</span>
          </div>
        )}
        {hasGstin && (
          <div className="flex justify-between text-[10px] font-semibold text-gray-800">
            <span>GSTIN:</span>
            <span>{gstin.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Itemized Table */}
      <div className="my-3">
        <div className="flex justify-between border-b border-dashed border-black/40 pb-1 text-[10px] font-bold">
          <span className="w-1/2">ITEM DESCRIPTION</span>
          <span className="w-1/12 text-center">QTY</span>
          <span className="w-3/12 text-right">RATE</span>
          <span className="w-3/12 text-right">TOTAL</span>
        </div>
        
        <div className="divide-y divide-dashed divide-black/10 text-[10px] py-1">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between py-1.5 items-baseline">
              <span className="w-1/2 font-medium break-words leading-tight">{item.name}</span>
              <span className="w-1/12 text-center">{item.quantity}</span>
              <span className="w-3/12 text-right">₹{Number(item.price).toFixed(2)}</span>
              <span className="w-3/12 text-right font-semibold">₹{(item.quantity * item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subtotal & Tax Breakdowns */}
      <div className="border-t border-dashed border-black/40 pt-2 space-y-1.5 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>

        {hasGstin && (
          <>
            <div className="flex justify-between text-gray-600">
              <span>CGST ({cgstRate.toFixed(1)}%):</span>
              <span>₹{cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>SGST ({sgstRate.toFixed(1)}%):</span>
              <span>₹{sgstAmount.toFixed(2)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between border-t border-dashed border-black/40 pt-1.5 text-xs font-bold">
          <span>GRAND TOTAL:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>



      {/* Receipt Footer */}
      <div className="text-center text-[9px] text-gray-600 space-y-1 border-t border-dashed border-black/40 pt-3">
        <p className="font-semibold uppercase tracking-wider">Thank you for dining with us!</p>
        <p className="italic">Powered by ScanServe SaaS</p>
        {hasGstin && (
          <p className="font-bold text-[8px] tracking-[0.1em] uppercase mt-1 text-gray-500">
            *** TAX INVOICE ***
          </p>
        )}
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
