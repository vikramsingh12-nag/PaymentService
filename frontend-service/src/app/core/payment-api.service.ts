import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PaymentCreatedResponse,
  PaymentDetailsResponse,
  PaymentMethodOption,
  PaymentRequest,
  ReceiptResponse
} from './payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api';

  getPaymentMethods(): Observable<PaymentMethodOption[]> {
    return this.http.get<PaymentMethodOption[]>(`${this.apiUrl}/payment-methods`);
  }

  createPayment(request: PaymentRequest): Observable<PaymentCreatedResponse> {
    return this.http.post<PaymentCreatedResponse>(`${this.apiUrl}/payments`, request);
  }

  getTransaction(paymentId: string): Observable<PaymentDetailsResponse> {
    return this.http.get<PaymentDetailsResponse>(`${this.apiUrl}/payments/${paymentId}`);
  }

  getReceipt(paymentId: string): Observable<ReceiptResponse> {
    return this.http.get<ReceiptResponse>(`${this.apiUrl}/payments/${paymentId}/receipt`);
  }
}
