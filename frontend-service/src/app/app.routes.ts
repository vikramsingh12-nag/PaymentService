import { Routes } from '@angular/router';
import {
  CheckoutPageComponent,
  PaymentStatusPageComponent,
  ProcessingPageComponent,
  ReceiptPageComponent,
  TransactionDetailsPageComponent
} from './payment-pages';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'checkout'
  },
  {
    path: 'checkout',
    component: CheckoutPageComponent
  },
  {
    path: 'processing/:id',
    component: ProcessingPageComponent
  },
  {
    path: 'confirmation/:id',
    component: PaymentStatusPageComponent,
    data: {
      variant: 'success'
    }
  },
  {
    path: 'error/:id',
    component: PaymentStatusPageComponent,
    data: {
      variant: 'error'
    }
  },
  {
    path: 'transactions/:id',
    component: TransactionDetailsPageComponent
  },
  {
    path: 'receipts/:id',
    component: ReceiptPageComponent
  },
  {
    path: '**',
    redirectTo: 'checkout'
  }
];
