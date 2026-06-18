# PaymentService

Monorepo scaffold for a payment experience with:

- `frontend-service/`: Angular v22 checkout UI
- `backend-service/`: Spring Boot (Java 21) API

## Frontend service

The Angular application includes a demo payment journey covering:

- UPI payments
- Credit card payments
- Debit card payments
- UPI QR scan-and-pay UI
- Processing screen with status polling
- Confirmation screen
- Error screen
- Transaction details screen
- Receipt screen

### Run locally

Angular 22 requires Node.js `22.22.3` or newer.

```bash
cd frontend-service
npm install
npm start
```

The frontend expects the backend API at `http://localhost:8080/api`.

## Backend service

The Spring Boot backend provides:

- `GET /api/payment-methods`
- `POST /api/payments`
- `GET /api/payments/{paymentId}`
- `GET /api/payments/{paymentId}/receipt`

It uses an in-memory payment store to simulate processing and final transaction outcomes.

### Run locally

Java 21 is required.

```bash
cd backend-service
./mvnw spring-boot:run
```

### Run tests

```bash
cd backend-service
./mvnw test
```

## Suggested local startup order

1. Start the Spring Boot backend on port `8080`
2. Start the Angular frontend on port `4200`
3. Open `http://localhost:4200`

## Demo behavior

The frontend exposes a **Simulation outcome** switch so you can intentionally trigger either:

- a successful payment flow, or
- a failed payment flow

That makes it easy to validate both confirmation and error screens without a real gateway integration.