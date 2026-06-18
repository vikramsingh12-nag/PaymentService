package com.paymentservice.backend.payments;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class PaymentModels {

	private PaymentModels() {
	}

	public enum PaymentMethodType {
		UPI,
		CREDIT_CARD,
		DEBIT_CARD,
		UPI_QR
	}

	public enum PaymentStatus {
		PROCESSING,
		SUCCESS,
		FAILED
	}

	public enum SimulationMode {
		SUCCESS,
		FAILED
	}

	public record PaymentMethodOption(
		PaymentMethodType type,
		String title,
		String subtitle,
		String helperText,
		String accent
	) {
	}

	public record PaymentRequest(
		@NotBlank(message = "Order ID is required")
		String orderId,
		@NotBlank(message = "Customer name is required")
		String customerName,
		@NotBlank(message = "Customer email is required")
		@Email(message = "Customer email must be valid")
		String customerEmail,
		@NotNull(message = "Amount is required")
		@Positive(message = "Amount must be greater than zero")
		BigDecimal amount,
		@NotBlank(message = "Currency is required")
		String currency,
		@NotNull(message = "Payment method is required")
		PaymentMethodType paymentMethod,
		@NotNull(message = "Simulation mode is required")
		SimulationMode simulationMode,
		String upiId,
		String cardHolderName,
		String cardNumber,
		String expiryMonth,
		String expiryYear,
		String cvv,
		String qrReference
	) {
	}

	public record PaymentCreatedResponse(
		String paymentId,
		PaymentStatus status,
		String message,
		Integer pollAfterMs,
		OffsetDateTime createdAt
	) {
	}

	public record PaymentDetailsResponse(
		String paymentId,
		String orderId,
		BigDecimal amount,
		String currency,
		PaymentMethodType paymentMethod,
		PaymentStatus status,
		String merchantName,
		String maskedInstrument,
		String customerName,
		String customerEmail,
		String referenceNumber,
		String qrPayload,
		String failureReason,
		OffsetDateTime createdAt,
		OffsetDateTime updatedAt
	) {
	}

	public record ReceiptLineItem(
		String label,
		BigDecimal amount
	) {
	}

	public record ReceiptResponse(
		String paymentId,
		String receiptNumber,
		String merchantName,
		BigDecimal amount,
		String currency,
		PaymentMethodType paymentMethod,
		PaymentStatus status,
		String customerName,
		String customerEmail,
		String referenceNumber,
		List<ReceiptLineItem> lineItems,
		String supportContact,
		String note,
		OffsetDateTime issuedAt
	) {
	}
}
