import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';

import { PaymentApiService } from './core/payment-api.service';
import {
  PaymentDetailsResponse,
  PaymentMethodOption,
  PaymentMethodType,
  PaymentRequest,
  ReceiptResponse,
  SimulationMode
} from './core/payment.models';

const DEFAULT_AMOUNT = 2499;
const DEFAULT_CURRENCY = 'INR';

function readApiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const apiMessage = error.error?.message ?? error.error?.detail;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }
  }

  return 'Something went wrong while connecting to the payment service.';
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="eyebrow">Angular 22 payment demo</span>
          <h1>Checkout experience for UPI, cards, and QR-based payments.</h1>
          <p>
            This frontend talks to the Spring Boot backend to simulate payment initiation,
            processing, final confirmation, failure handling, transaction details, and receipt views.
          </p>
        </div>

        <div class="summary-card">
          <p class="summary-label">Order summary</p>
          <h2>{{ form.controls.orderId.value }}</h2>
          <div class="summary-row">
            <span>Merchant</span>
            <strong>Nova Payments</strong>
          </div>
          <div class="summary-row">
            <span>Amount due</span>
            <strong>{{ form.controls.amount.value | currency: form.controls.currency.value }}</strong>
          </div>
          <div class="summary-row">
            <span>Customer</span>
            <strong>{{ form.controls.customerName.value }}</strong>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Choose payment method</span>
              <h2>Accepted payment options</h2>
            </div>
            <span class="pill pill-neutral">{{ paymentMethods().length }} methods</span>
          </div>

          @if (loadingMethods()) {
            <div class="empty-state">Loading payment methods from the backend...</div>
          } @else {
            <div class="method-grid">
              @for (method of paymentMethods(); track method.type) {
                <button
                  type="button"
                  class="method-card"
                  [class.method-card-active]="selectedMethod() === method.type"
                  (click)="chooseMethod(method.type)"
                >
                  <span class="method-accent" [style.background]="method.accent"></span>
                  <strong>{{ method.title }}</strong>
                  <span>{{ method.subtitle }}</span>
                  <small>{{ method.helperText }}</small>
                </button>
              }
            </div>
          }
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Complete payment</span>
              <h2>{{ activeMethodTitle() }}</h2>
            </div>
            <span class="pill" [class.pill-danger]="form.controls.simulationMode.value === 'FAILED'">
              Demo mode: {{ form.controls.simulationMode.value }}
            </span>
          </div>

          <form class="payment-form" [formGroup]="form" (ngSubmit)="submitPayment()">
            <div class="form-grid">
              <label class="field">
                <span>Customer name</span>
                <input type="text" formControlName="customerName" placeholder="Aarav Sharma" />
              </label>

              <label class="field">
                <span>Email address</span>
                <input type="email" formControlName="customerEmail" placeholder="aarav@example.com" />
              </label>

              <label class="field">
                <span>Order ID</span>
                <input type="text" formControlName="orderId" />
              </label>

              <label class="field">
                <span>Amount</span>
                <input type="number" min="1" step="1" formControlName="amount" />
              </label>
            </div>

            <div class="field">
              <span>Simulation outcome</span>
              <div class="choice-row">
                <label class="choice-chip">
                  <input type="radio" formControlName="simulationMode" value="SUCCESS" />
                  <span>Success flow</span>
                </label>
                <label class="choice-chip">
                  <input type="radio" formControlName="simulationMode" value="FAILED" />
                  <span>Error flow</span>
                </label>
              </div>
            </div>

            @if (selectedMethod() === 'UPI') {
              <div class="field">
                <span>UPI ID</span>
                <input type="text" formControlName="upiId" placeholder="demo@upi" />
                <small class="hint">Pay via any UPI app using your virtual payment address.</small>
              </div>
            }

            @if (selectedMethod() === 'CREDIT_CARD' || selectedMethod() === 'DEBIT_CARD') {
              <div class="form-grid">
                <label class="field field-full">
                  <span>Card holder name</span>
                  <input type="text" formControlName="cardHolderName" placeholder="Aarav Sharma" />
                </label>

                <label class="field field-full">
                  <span>Card number</span>
                  <input type="text" formControlName="cardNumber" placeholder="4111111111111111" />
                </label>

                <label class="field">
                  <span>Expiry month</span>
                  <input type="text" formControlName="expiryMonth" placeholder="12" />
                </label>

                <label class="field">
                  <span>Expiry year</span>
                  <input type="text" formControlName="expiryYear" placeholder="2030" />
                </label>

                <label class="field">
                  <span>CVV</span>
                  <input type="password" formControlName="cvv" placeholder="123" />
                </label>
              </div>
            }

            @if (selectedMethod() === 'UPI_QR') {
              <div class="qr-preview">
                <div class="qr-box">
                  <div class="qr-cell dark"></div>
                  <div class="qr-cell dark"></div>
                  <div class="qr-cell"></div>
                  <div class="qr-cell dark"></div>
                  <div class="qr-cell"></div>
                  <div class="qr-cell dark"></div>
                  <div class="qr-cell"></div>
                  <div class="qr-cell dark"></div>
                  <div class="qr-cell dark"></div>
                </div>
                <div>
                  <h3>Scan to pay</h3>
                  <p>Show a QR journey alongside dynamic backend receipt generation.</p>
                </div>
              </div>

              <div class="field">
                <span>QR reference</span>
                <input type="text" formControlName="qrReference" placeholder="scan-and-pay-demo" />
                <small class="hint">Useful for capturing the scan source or kiosk reference.</small>
              </div>
            }

            @if (submitError(); as errorMessage) {
              <div class="alert alert-error">{{ errorMessage }}</div>
            }

            <div class="action-row">
              <button class="primary-button" type="submit" [disabled]="submitting()">
                {{ submitting() ? 'Starting payment...' : 'Pay now' }}
              </button>
              <button class="secondary-button" type="button" (click)="resetDemo()">
                Reset demo data
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  `
})
export class CheckoutPageComponent implements OnInit {
  private readonly api = inject(PaymentApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingMethods = signal(true);
  readonly paymentMethods = signal<PaymentMethodOption[]>([]);
  readonly selectedMethod = signal<PaymentMethodType>('UPI');
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly activeMethodTitle = computed(
    () =>
      this.paymentMethods().find((method) => method.type === this.selectedMethod())?.title ??
      'Payment method'
  );

  readonly form = this.fb.nonNullable.group({
    customerName: ['Aarav Sharma', [Validators.required, Validators.minLength(2)]],
    customerEmail: ['aarav@example.com', [Validators.required, Validators.email]],
    orderId: ['ORD-20260618-001', [Validators.required]],
    amount: [DEFAULT_AMOUNT, [Validators.required, Validators.min(1)]],
    currency: [DEFAULT_CURRENCY, [Validators.required]],
    paymentMethod: ['UPI' as PaymentMethodType, [Validators.required]],
    simulationMode: ['SUCCESS' as SimulationMode, [Validators.required]],
    upiId: ['aarav@upi'],
    cardHolderName: ['Aarav Sharma'],
    cardNumber: ['4111111111111111'],
    expiryMonth: ['12'],
    expiryYear: ['2030'],
    cvv: ['123'],
    qrReference: ['scan-and-pay-demo']
  });

  ngOnInit(): void {
    this.form.controls.paymentMethod.valueChanges
      .pipe(startWith(this.form.controls.paymentMethod.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        const resolvedMethod = method as PaymentMethodType;
        this.selectedMethod.set(resolvedMethod);
        this.applyMethodValidators(resolvedMethod);
      });

    this.api
      .getPaymentMethods()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.submitError.set(readApiError(error));
          this.loadingMethods.set(false);
          return of([]);
        })
      )
      .subscribe((methods) => {
        this.paymentMethods.set(methods);
        this.loadingMethods.set(false);
      });
  }

  chooseMethod(method: PaymentMethodType): void {
    this.form.patchValue({
      paymentMethod: method
    });
  }

  resetDemo(): void {
    this.form.reset({
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav@example.com',
      orderId: 'ORD-20260618-001',
      amount: DEFAULT_AMOUNT,
      currency: DEFAULT_CURRENCY,
      paymentMethod: 'UPI',
      simulationMode: 'SUCCESS',
      upiId: 'aarav@upi',
      cardHolderName: 'Aarav Sharma',
      cardNumber: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2030',
      cvv: '123',
      qrReference: 'scan-and-pay-demo'
    });
    this.submitError.set(null);
  }

  submitPayment(): void {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();
    const request: PaymentRequest = {
      orderId: value.orderId,
      customerName: value.customerName,
      customerEmail: value.customerEmail,
      amount: value.amount,
      currency: value.currency,
      paymentMethod: value.paymentMethod,
      simulationMode: value.simulationMode,
      upiId: this.toOptional(value.upiId),
      cardHolderName: this.toOptional(value.cardHolderName),
      cardNumber: this.toOptional(value.cardNumber),
      expiryMonth: this.toOptional(value.expiryMonth),
      expiryYear: this.toOptional(value.expiryYear),
      cvv: this.toOptional(value.cvv),
      qrReference: this.toOptional(value.qrReference)
    };

    this.api
      .createPayment(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          void this.router.navigate(['/processing', response.paymentId]);
        },
        error: (error) => {
          this.submitting.set(false);
          this.submitError.set(readApiError(error));
        }
      });
  }

  private applyMethodValidators(method: PaymentMethodType): void {
    const upiIdControl = this.form.controls.upiId;
    const cardHolderControl = this.form.controls.cardHolderName;
    const cardNumberControl = this.form.controls.cardNumber;
    const expiryMonthControl = this.form.controls.expiryMonth;
    const expiryYearControl = this.form.controls.expiryYear;
    const cvvControl = this.form.controls.cvv;
    const qrReferenceControl = this.form.controls.qrReference;

    upiIdControl.clearValidators();
    cardHolderControl.clearValidators();
    cardNumberControl.clearValidators();
    expiryMonthControl.clearValidators();
    expiryYearControl.clearValidators();
    cvvControl.clearValidators();
    qrReferenceControl.clearValidators();

    if (method === 'UPI') {
      upiIdControl.setValidators([Validators.required]);
    }

    if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
      cardHolderControl.setValidators([Validators.required]);
      cardNumberControl.setValidators([Validators.required, Validators.pattern(/^\d{16,19}$/)]);
      expiryMonthControl.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]);
      expiryYearControl.setValidators([Validators.required, Validators.pattern(/^\d{4}$/)]);
      cvvControl.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
    }

    if (method === 'UPI_QR') {
      qrReferenceControl.setValidators([Validators.required]);
    }

    [
      upiIdControl,
      cardHolderControl,
      cardNumberControl,
      expiryMonthControl,
      expiryYearControl,
      cvvControl,
      qrReferenceControl
    ].forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
  }

  private toOptional(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}

@Component({
  selector: 'app-processing-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="panel processing-panel">
        <span class="eyebrow">Processing screen</span>
        <h1>Payment is being authorized...</h1>
        <p>
          We are polling the Spring Boot backend for the latest transaction state and will redirect
          automatically once a final status is available.
        </p>

        <div class="spinner-ring" aria-hidden="true"></div>

        @if (transaction(); as payment) {
          <div class="status-card">
            <div class="summary-row">
              <span>Transaction ID</span>
              <strong>{{ payment.paymentId }}</strong>
            </div>
            <div class="summary-row">
              <span>Method</span>
              <strong>{{ payment.paymentMethod }}</strong>
            </div>
            <div class="summary-row">
              <span>Amount</span>
              <strong>{{ payment.amount | currency: payment.currency }}</strong>
            </div>
            <div class="summary-row">
              <span>Backend status</span>
              <strong>{{ payment.status }}</strong>
            </div>
          </div>
        }

        @if (pollError(); as errorMessage) {
          <div class="alert alert-error">{{ errorMessage }}</div>
        }

        <div class="action-row">
          <a class="secondary-button" routerLink="/checkout">Start another payment</a>
        </div>
      </section>
    </main>
  `
})
export class ProcessingPageComponent implements OnInit {
  private readonly api = inject(PaymentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly transaction = signal<PaymentDetailsResponse | null>(null);
  readonly pollError = signal<string | null>(null);

  ngOnInit(): void {
    const paymentId = this.route.snapshot.paramMap.get('id');
    if (!paymentId) {
      void this.router.navigate(['/checkout']);
      return;
    }

    interval(1500)
      .pipe(
        startWith(0),
        switchMap(() => this.api.getTransaction(paymentId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (payment) => {
          this.transaction.set(payment);
          this.pollError.set(null);

          if (payment.status === 'SUCCESS') {
            void this.router.navigate(['/confirmation', payment.paymentId]);
          }

          if (payment.status === 'FAILED') {
            void this.router.navigate(['/error', payment.paymentId]);
          }
        },
        error: (error) => {
          this.pollError.set(readApiError(error));
        }
      });
  }
}

@Component({
  selector: 'app-payment-status-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="panel status-panel" [class.status-panel-failed]="variant() === 'error'">
        <span class="eyebrow">{{ variant() === 'success' ? 'Confirmation' : 'Error state' }}</span>
        <h1>{{ variant() === 'success' ? 'Payment completed successfully.' : 'Payment could not be completed.' }}</h1>
        <p>
          {{
            variant() === 'success'
              ? 'The transaction was finalized by the backend and a receipt is ready for viewing.'
              : 'Use this screen to surface retry messaging, failure reasons, and support actions.'
          }}
        </p>

        @if (transaction(); as payment) {
          <div class="status-card">
            <div class="summary-row">
              <span>Reference number</span>
              <strong>{{ payment.referenceNumber }}</strong>
            </div>
            <div class="summary-row">
              <span>Method</span>
              <strong>{{ payment.paymentMethod }}</strong>
            </div>
            <div class="summary-row">
              <span>Updated</span>
              <strong>{{ payment.updatedAt | date: 'medium' }}</strong>
            </div>
            <div class="summary-row">
              <span>Amount</span>
              <strong>{{ payment.amount | currency: payment.currency }}</strong>
            </div>

            @if (payment.failureReason) {
              <div class="alert alert-error">{{ payment.failureReason }}</div>
            }
          </div>
        }

        @if (loadError(); as errorMessage) {
          <div class="alert alert-error">{{ errorMessage }}</div>
        }

        <div class="action-row">
          <a class="primary-button" [routerLink]="['/transactions', paymentId()]">View transaction details</a>
          <a class="secondary-button" [routerLink]="['/receipts', paymentId()]">Open receipt</a>
          <a class="secondary-button" routerLink="/checkout">New payment</a>
        </div>
      </section>
    </main>
  `
})
export class PaymentStatusPageComponent implements OnInit {
  private readonly api = inject(PaymentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly transaction = signal<PaymentDetailsResponse | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly variant = signal<'success' | 'error'>('success');
  readonly paymentId = signal('');

  ngOnInit(): void {
    const paymentId = this.route.snapshot.paramMap.get('id');
    if (!paymentId) {
      void this.router.navigate(['/checkout']);
      return;
    }

    this.paymentId.set(paymentId);
    this.variant.set(this.route.snapshot.data['variant'] === 'error' ? 'error' : 'success');

    this.api
      .getTransaction(paymentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payment) => {
          this.transaction.set(payment);
        },
        error: (error) => {
          this.loadError.set(readApiError(error));
        }
      });
  }
}

@Component({
  selector: 'app-transaction-details-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="eyebrow">Transaction details</span>
            <h1>Backend-served payment metadata</h1>
          </div>
          <a class="secondary-button" routerLink="/checkout">Return to checkout</a>
        </div>

        @if (transaction(); as payment) {
          <div class="details-grid">
            <div class="detail-card">
              <span>Status</span>
              <strong>{{ payment.status }}</strong>
            </div>
            <div class="detail-card">
              <span>Instrument</span>
              <strong>{{ payment.maskedInstrument }}</strong>
            </div>
            <div class="detail-card">
              <span>Merchant</span>
              <strong>{{ payment.merchantName }}</strong>
            </div>
            <div class="detail-card">
              <span>Reference</span>
              <strong>{{ payment.referenceNumber }}</strong>
            </div>
          </div>

          <div class="status-card">
            <div class="summary-row">
              <span>Customer</span>
              <strong>{{ payment.customerName }}</strong>
            </div>
            <div class="summary-row">
              <span>Email</span>
              <strong>{{ payment.customerEmail }}</strong>
            </div>
            <div class="summary-row">
              <span>Created</span>
              <strong>{{ payment.createdAt | date: 'medium' }}</strong>
            </div>
            <div class="summary-row">
              <span>Last updated</span>
              <strong>{{ payment.updatedAt | date: 'medium' }}</strong>
            </div>
            <div class="summary-row">
              <span>Amount</span>
              <strong>{{ payment.amount | currency: payment.currency }}</strong>
            </div>
            @if (payment.qrPayload) {
              <div class="summary-row">
                <span>QR payload</span>
                <strong>{{ payment.qrPayload }}</strong>
              </div>
            }
          </div>

          <div class="action-row">
            <a class="primary-button" [routerLink]="['/receipts', payment.paymentId]">View receipt</a>
            <a class="secondary-button" [routerLink]="['/confirmation', payment.paymentId]">Back to summary</a>
          </div>
        }

        @if (loadError(); as errorMessage) {
          <div class="alert alert-error">{{ errorMessage }}</div>
        }
      </section>
    </main>
  `
})
export class TransactionDetailsPageComponent implements OnInit {
  private readonly api = inject(PaymentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly transaction = signal<PaymentDetailsResponse | null>(null);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    const paymentId = this.route.snapshot.paramMap.get('id');
    if (!paymentId) {
      void this.router.navigate(['/checkout']);
      return;
    }

    this.api
      .getTransaction(paymentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payment) => {
          this.transaction.set(payment);
        },
        error: (error) => {
          this.loadError.set(readApiError(error));
        }
      });
  }
}

@Component({
  selector: 'app-receipt-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="panel receipt-shell">
        <div class="panel-header">
          <div>
            <span class="eyebrow">Receipt</span>
            <h1>Printable payment acknowledgment</h1>
          </div>
          <div class="action-row">
            <button class="secondary-button" type="button" (click)="printReceipt()">Print</button>
            <a class="secondary-button" routerLink="/checkout">Return to checkout</a>
          </div>
        </div>

        @if (receipt(); as paymentReceipt) {
          <div class="receipt-card">
            <div class="receipt-header">
              <div>
                <span class="eyebrow">Receipt number</span>
                <h2>{{ paymentReceipt.receiptNumber }}</h2>
              </div>
              <span class="pill" [class.pill-danger]="paymentReceipt.status === 'FAILED'">
                {{ paymentReceipt.status }}
              </span>
            </div>

            <div class="receipt-grid">
              <div>
                <span>Merchant</span>
                <strong>{{ paymentReceipt.merchantName }}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{{ paymentReceipt.customerName }}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{{ paymentReceipt.customerEmail }}</strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{{ paymentReceipt.referenceNumber }}</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>{{ paymentReceipt.paymentMethod }}</strong>
              </div>
              <div>
                <span>Issued at</span>
                <strong>{{ paymentReceipt.issuedAt | date: 'medium' }}</strong>
              </div>
            </div>

            <div class="receipt-lines">
              @for (lineItem of paymentReceipt.lineItems; track lineItem.label) {
                <div class="summary-row">
                  <span>{{ lineItem.label }}</span>
                  <strong>{{ lineItem.amount | currency: paymentReceipt.currency }}</strong>
                </div>
              }
              <div class="summary-row summary-total">
                <span>Total paid</span>
                <strong>{{ paymentReceipt.amount | currency: paymentReceipt.currency }}</strong>
              </div>
            </div>

            <div class="receipt-footer">
              <p>{{ paymentReceipt.note }}</p>
              <small>Need support? {{ paymentReceipt.supportContact }}</small>
            </div>
          </div>
        }

        @if (loadError(); as errorMessage) {
          <div class="alert alert-error">{{ errorMessage }}</div>
        }
      </section>
    </main>
  `
})
export class ReceiptPageComponent implements OnInit {
  private readonly api = inject(PaymentApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly receipt = signal<ReceiptResponse | null>(null);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    const paymentId = this.route.snapshot.paramMap.get('id');
    if (!paymentId) {
      void this.router.navigate(['/checkout']);
      return;
    }

    this.api
      .getReceipt(paymentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (receipt) => {
          this.receipt.set(receipt);
        },
        error: (error) => {
          this.loadError.set(readApiError(error));
        }
      });
  }

  printReceipt(): void {
    window.print();
  }
}
