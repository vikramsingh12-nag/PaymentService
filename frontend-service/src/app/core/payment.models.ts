export type PaymentMethodType = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI_QR';
export type PaymentStatus = 'PROCESSING' | 'SUCCESS' | 'FAILED';
export type SimulationMode = 'SUCCESS' | 'FAILED';

export interface PaymentMethodOption {
  type: PaymentMethodType;
  title: string;
  subtitle: string;
  helperText: string;
  accent: string;
}

export interface PaymentRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  simulationMode: SimulationMode;
  upiId?: string;
  cardHolderName?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  qrReference?: string;
}

export interface PaymentCreatedResponse {
  paymentId: string;
  status: PaymentStatus;
  message: string;
  pollAfterMs: number;
  createdAt: string;
}

export interface PaymentDetailsResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  merchantName: string;
  maskedInstrument: string;
  customerName: string;
  customerEmail: string;
  referenceNumber: string;
  qrPayload: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptLineItem {
  label: string;
  amount: number;
}

export interface ReceiptResponse {
  paymentId: string;
  receiptNumber: string;
  merchantName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  customerName: string;
  customerEmail: string;
  referenceNumber: string;
  lineItems: ReceiptLineItem[];
  supportContact: string;
  note: string;
  issuedAt: string;
}
