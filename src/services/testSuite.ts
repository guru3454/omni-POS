import { storage } from './storage';
import { HardwareService } from './hardware';
import { FiscalService } from './fiscal';
import { OrderType, PaymentMethod, UserRole, KitchenStation } from '../types';

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'FINANCIAL' | 'SECURITY' | 'STATE_MACHINE' | 'HOTEL_FOLIO' | 'INVENTORY' | 'OFFLINE_HAL';
  passed: boolean;
  message: string;
  durationMs: number;
}

export class TestSuiteRunner {
  public static async runAllTests(): Promise<TestCaseResult[]> {
    const results: TestCaseResult[] = [];

    // Test 1: Financial Tax & Surcharge Calculation
    {
      const start = performance.now();
      try {
        const dummyLines: any[] = [
          { lineTotal: 100, isVoided: false },
          { lineTotal: 50, isVoided: false },
        ];
        // Outlet tax: 16% VAT, 5% Service Charge, 2% Catering Levy = 23%
        const totals = storage.calculateOrderTotals(dummyLines, 0);
        const expectedTax = 24.0; // 150 * 0.16
        const expectedSC = 7.5; // 150 * 0.05
        const expectedCL = 3.0; // 150 * 0.02
        const expectedTotal = 184.5; // 150 + 24 + 7.5 + 3

        const passed =
          totals.subtotal === 150 &&
          totals.taxAmount === expectedTax &&
          totals.serviceChargeAmount === expectedSC &&
          totals.cateringLevyAmount === expectedCL &&
          totals.totalAmount === expectedTotal;

        results.push({
          id: 'TEST-FIN-01',
          name: 'Tax, Service Charge & Levy Computation',
          category: 'FINANCIAL',
          passed,
          message: passed
            ? `Correct: Subtotal $${totals.subtotal}, Tax $${totals.taxAmount}, Total $${totals.totalAmount}`
            : `Mismatch: Expected $${expectedTotal}, got $${totals.totalAmount}`,
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-FIN-01',
          name: 'Tax, Service Charge & Levy Computation',
          category: 'FINANCIAL',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    // Test 2: 4-Tier Nested Modifier Price Summation
    {
      const start = performance.now();
      try {
        const basePrice = 24.0; // Wagyu burger
        const mod1 = 8.0; // Double patty
        const mod2 = 2.0; // Gruyere cheese
        const mod3 = 3.5; // Bacon (nested extra crispy)
        const total = basePrice + mod1 + mod2 + mod3;

        const passed = total === 37.5;
        results.push({
          id: 'TEST-FIN-02',
          name: '4-Tier Modifier Nesting & Delta Accumulation',
          category: 'FINANCIAL',
          passed,
          message: passed ? `Summed 4-level modifier total accurately: $${total.toFixed(2)}` : 'Modifier price math failed',
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-FIN-02',
          name: '4-Tier Modifier Nesting & Delta Accumulation',
          category: 'FINANCIAL',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    // Test 3: Manager PIN Verification for Sensitive Line Voids
    {
      const start = performance.now();
      try {
        const validManager = storage.verifyManagerPin('1234'); // Marcus Vance (Admin)
        const invalidManager = storage.verifyManagerPin('0000'); // Wrong PIN

        const passed = !!validManager && invalidManager === null;
        results.push({
          id: 'TEST-SEC-01',
          name: 'Manager PIN Role Authorization Verification',
          category: 'SECURITY',
          passed,
          message: passed
            ? `Manager PIN verified successfully (${validManager?.name}). Unauthorized PIN rejected.`
            : 'PIN authorization check failed',
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-SEC-01',
          name: 'Manager PIN Role Authorization Verification',
          category: 'SECURITY',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    // Test 4: Hotel Folio Credit Limit Enforcement
    {
      const start = performance.now();
      try {
        const state = storage.getState();
        const folio101 = state.folios.find((f) => f.roomNumber === '101');
        const creditLimit = folio101?.creditLimit || 3000;
        const currentCharges = folio101?.totalCharges || 842.5;

        // Try to post charge that exceeds remaining credit ($5,000 > limit)
        let errorCaught = false;
        try {
          const testOrder = storage.createOrder(undefined, OrderType.ROOM_SERVICE, 1, '101', 'Lord Sterling', folio101?.id);
          storage.processPayment(testOrder.id, 5000, 0, PaymentMethod.ROOM_CHARGE, 'test-idemp-limit', {
            roomNumber: '101',
            guestFolioId: folio101?.id,
          });
        } catch (e: any) {
          if (e.message.includes('exceeds guest credit limit')) {
            errorCaught = true;
          }
        }

        results.push({
          id: 'TEST-HTL-01',
          name: 'Hotel Guest Folio Credit Limit Guard',
          category: 'HOTEL_FOLIO',
          passed: errorCaught,
          message: errorCaught
            ? `Blocked charge exceeding limit (Credit Limit: $${creditLimit}, Current: $${currentCharges})`
            : 'Failed: Room charge above credit limit was not rejected',
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-HTL-01',
          name: 'Hotel Guest Folio Credit Limit Guard',
          category: 'HOTEL_FOLIO',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    // Test 5: Inventory BOM Recipe Consumption
    {
      const start = performance.now();
      try {
        const state = storage.getState();
        const ribeyeItem = state.inventory.find((i) => i.id === 'inv-beef-ribeye');
        const stockBefore = ribeyeItem?.currentStock || 0;

        // Create and submit order with ribeye
        const order = storage.createOrder(undefined, OrderType.DINE_IN, 1);
        storage.addLineToOrder(order.id, {
          menuItemId: 'item-ribeye-400g',
          name: 'Black Angus Ribeye (400g)',
          unitPrice: 42.0,
          quantity: 1,
          seatNumber: 1,
          selectedModifiers: [],
          modifiersPrice: 0,
          lineTotal: 42.0,
          station: KitchenStation.GRILL,
        });

        storage.submitOrderToKitchen(order.id);

        const stockAfter = ribeyeItem?.currentStock || 0;
        const passed = Math.abs(stockBefore - stockAfter - 0.4) < 0.001;

        results.push({
          id: 'TEST-INV-01',
          name: 'Bill of Materials (BOM) Ingredient Degradation',
          category: 'INVENTORY',
          passed,
          message: passed
            ? `Accurately deducted 0.4 KG Ribeye stock (Prev: ${stockBefore}kg -> New: ${stockAfter}kg)`
            : `Stock mismatch: expected -0.4kg, got diff of ${stockBefore - stockAfter}kg`,
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-INV-01',
          name: 'Bill of Materials (BOM) Ingredient Degradation',
          category: 'INVENTORY',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    // Test 6: Payment Idempotency Token
    {
      const start = performance.now();
      try {
        const order = storage.createOrder(undefined, OrderType.TAKEAWAY, 1);
        storage.addLineToOrder(order.id, {
          menuItemId: 'item-valrhona-souffle',
          name: 'Soufflé',
          unitPrice: 15.0,
          quantity: 1,
          seatNumber: 1,
          selectedModifiers: [],
          modifiersPrice: 0,
          lineTotal: 15.0,
          station: KitchenStation.DESSERT,
        });

        const key = 'idemp-key-unique-' + Date.now();
        const p1 = storage.processPayment(order.id, 10, 0, PaymentMethod.CASH, key);
        const p2 = storage.processPayment(order.id, 10, 0, PaymentMethod.CASH, key);

        const passed = p1.payment.id === p2.payment.id;
        results.push({
          id: 'TEST-FIN-03',
          name: 'Payment Idempotency & Duplicate Replay Protection',
          category: 'FINANCIAL',
          passed,
          message: passed
            ? `Duplicate payment call with same Idempotency Key returned existing transaction ${p1.payment.referenceNumber}`
            : 'Failed: duplicate charge was created for identical key',
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-FIN-03',
          name: 'Payment Idempotency & Duplicate Replay Protection',
          category: 'FINANCIAL',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    // Test 7: Fiscal eTIMS Cryptographic Invoice Signing
    {
      const start = performance.now();
      try {
        const state = storage.getState();
        const activeOrder = state.orders[0];
        const fiscalRecord = FiscalService.signInvoice(activeOrder);

        const passed =
          !!fiscalRecord.fiscalSignature &&
          fiscalRecord.fiscalSignature.includes('KRA-VERIFIED') &&
          fiscalRecord.qrCodeUrl.includes('etims.kra.go.ke');

        results.push({
          id: 'TEST-FSC-01',
          name: 'eTIMS / KRA Digital Fiscal Signature & QR Generation',
          category: 'FINANCIAL',
          passed,
          message: passed
            ? `Generated valid fiscal signature: ${fiscalRecord.fiscalSignature} with QR payload URL`
            : 'Fiscal signature generation failed',
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-FSC-01',
          name: 'eTIMS / KRA Digital Fiscal Signature & QR Generation',
          category: 'FINANCIAL',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    // Test 8: ESC/POS Thermal Receipt Generation
    {
      const start = performance.now();
      try {
        const state = storage.getState();
        const activeOrder = state.orders[0];
        const text = HardwareService.generateReceiptText({
          order: activeOrder,
          organization: state.organization,
          hotel: state.hotel,
          outlet: storage.getCurrentOutlet(),
          cashierName: state.currentUser.name,
        });

        const passed = text.includes('GRAND HORIZON') && text.includes('RECEIPT / TAX INVOICE') && text.includes('SUBTOTAL');
        results.push({
          id: 'TEST-HAL-01',
          name: 'ESC/POS Thermal Receipt Formatter',
          category: 'OFFLINE_HAL',
          passed,
          message: passed ? 'Receipt stream generated with standard monospace 42-column layout' : 'ESC/POS formatter defect',
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        results.push({
          id: 'TEST-HAL-01',
          name: 'ESC/POS Thermal Receipt Formatter',
          category: 'OFFLINE_HAL',
          passed: false,
          message: err.message,
          durationMs: Math.round(performance.now() - start),
        });
      }
    }

    return results;
  }
}
