import { Order, KitchenTicket, Organization, Hotel, Outlet } from '../types';

export interface PrintReceiptOptions {
  order: Order;
  organization: Organization;
  hotel: Hotel;
  outlet: Outlet;
  cashierName: string;
  fiscalSignature?: string;
  qrPayload?: string;
}

export class HardwareService {
  /**
   * Generates formatted ESC/POS style plaintext receipt preview
   */
  public static generateReceiptText(opts: PrintReceiptOptions): string {
    const { order, organization, hotel, outlet, cashierName, fiscalSignature, qrPayload } = opts;
    const divider = '==========================================';
    const subDivider = '------------------------------------------';

    const lines: string[] = [];

    lines.push(hotel.name.toUpperCase());
    lines.push(outlet.name);
    lines.push(hotel.address);
    lines.push(`Tel: ${hotel.phone}`);
    lines.push(`PIN/TAX NO: ${organization.taxNumber}`);
    lines.push(divider);

    lines.push(`RECEIPT / TAX INVOICE`);
    lines.push(`Order: ${order.orderNumber}    Type: ${order.orderType}`);
    if (order.tableName) lines.push(`Table: ${order.tableName}    Guests: ${order.guestCount}`);
    if (order.roomNumber) lines.push(`Room: ${order.roomNumber} (${order.guestName || 'Guest'})`);
    lines.push(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    lines.push(`Server: ${order.serverName}    Cashier: ${cashierName}`);
    lines.push(divider);

    lines.push(`QTY  DESCRIPTION                       TOTAL`);
    lines.push(subDivider);

    order.lines.forEach((line) => {
      if (line.isVoided) return;
      const qtyStr = `${line.quantity}x`.padEnd(4);
      const nameStr = line.name.length > 26 ? line.name.substring(0, 24) + '..' : line.name.padEnd(26);
      const priceStr = `$${line.lineTotal.toFixed(2)}`.padStart(10);
      lines.push(`${qtyStr} ${nameStr} ${priceStr}`);

      line.selectedModifiers.forEach((mod) => {
        const modText = `   + ${mod.optionName}${mod.nestedOptionName ? ` (${mod.nestedOptionName})` : ''}`;
        const modPrice = mod.priceDelta > 0 ? `+$${(mod.priceDelta * line.quantity).toFixed(2)}` : '';
        lines.push(`${modText.padEnd(31)} ${modPrice.padStart(10)}`);
      });

      if (line.seatNumber) {
        lines.push(`     [Seat ${line.seatNumber}]`);
      }
    });

    lines.push(subDivider);
    lines.push(`SUBTOTAL:                      $${order.subtotal.toFixed(2).padStart(10)}`);
    if (order.discountAmount > 0) {
      lines.push(`DISCOUNT (${order.discountPercent || 0}%):            -$${order.discountAmount.toFixed(2).padStart(10)}`);
    }
    lines.push(`VAT (16%):                     $${order.taxAmount.toFixed(2).padStart(10)}`);
    lines.push(`SERVICE CHARGE (5%):           $${order.serviceChargeAmount.toFixed(2).padStart(10)}`);
    lines.push(`CATERING LEVY (2%):            $${order.cateringLevyAmount.toFixed(2).padStart(10)}`);
    lines.push(divider);
    lines.push(`TOTAL AMOUNT DUE:              $${order.totalAmount.toFixed(2).padStart(10)}`);
    lines.push(`PAID AMOUNT:                   $${order.paidAmount.toFixed(2).padStart(10)}`);
    lines.push(`BALANCE DUE:                   $${order.balanceAmount.toFixed(2).padStart(10)}`);
    lines.push(divider);

    if (fiscalSignature) {
      lines.push(`FISCAL VERIFICATION:`);
      lines.push(`SIG: ${fiscalSignature}`);
      if (qrPayload) lines.push(`QR DATA: ${qrPayload}`);
      lines.push(subDivider);
    }

    lines.push(`THANK YOU FOR DINING WITH US!`);
    lines.push(`PLEASE VISIT AGAIN`);
    lines.push(`Powered by OmniPOS Hospitality Cloud`);

    return lines.join('\n');
  }

  /**
   * Generates formatted Kitchen Docket plaintext for impact / thermal kitchen printers
   */
  public static generateKitchenDocketText(ticket: KitchenTicket): string {
    const divider = '******************************************';
    const subDivider = '------------------------------------------';

    const lines: string[] = [];
    lines.push(divider);
    lines.push(`STATION: [${ticket.station}]`);
    lines.push(`ORDER: ${ticket.orderNumber}   TABLE: ${ticket.tableName || 'N/A'}`);
    if (ticket.roomNumber) lines.push(`ROOM SERVICE: ROOM ${ticket.roomNumber}`);
    lines.push(`SERVER: ${ticket.serverName}   PRIORITY: ${ticket.priority}`);
    lines.push(`TIME: ${new Date(ticket.createdAt).toLocaleTimeString()}`);
    lines.push(divider);

    ticket.items.forEach((item) => {
      lines.push(`[ ] ${item.quantity}x ${item.name.toUpperCase()} (Seat ${item.seatNumber})`);
      item.modifiersSummary.forEach((mod) => {
        lines.push(`      >> ${mod}`);
      });
      if (item.specialInstructions) {
        lines.push(`      ** NOTE: ${item.specialInstructions.toUpperCase()} **`);
      }
      lines.push('');
    });

    lines.push(subDivider);
    lines.push(`END OF TICKET - STATION: ${ticket.station}`);
    lines.push(divider);

    return lines.join('\n');
  }

  /**
   * Simulates Cash Drawer Pulse Kick Command (ESC p m t1 t2)
   */
  public static triggerCashDrawerKick(): { success: boolean; message: string } {
    return {
      success: true,
      message: 'Cash drawer kick pulse sent via ESC/POS command (\x1B\x70\x00\x19\xFA)',
    };
  }
}
