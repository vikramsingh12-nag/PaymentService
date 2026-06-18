package com.paymentservice.backend;

import static com.paymentservice.backend.payments.PaymentModels.PaymentMethodType.UPI;
import static com.paymentservice.backend.payments.PaymentModels.PaymentStatus.FAILED;
import static com.paymentservice.backend.payments.PaymentModels.PaymentStatus.PROCESSING;
import static com.paymentservice.backend.payments.PaymentModels.PaymentStatus.SUCCESS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.paymentservice.backend.payments.PaymentModels.PaymentRequest;
import com.paymentservice.backend.payments.PaymentModels.SimulationMode;
import com.paymentservice.backend.payments.PaymentService;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class BackendServiceApplicationTests {

	private final PaymentService paymentService = new PaymentService();

	@Test
	void createsPaymentAndTransitionsToSuccess() throws Exception {
		PaymentRequest request = new PaymentRequest(
			"ORD-1001",
			"Aarav Sharma",
			"aarav@example.com",
			BigDecimal.valueOf(2499),
			"INR",
			UPI,
			SimulationMode.SUCCESS,
			"aarav@upi",
			null,
			null,
			null,
			null,
			null,
			null
		);

		var createdPayment = paymentService.createPayment(request);
		assertEquals(PROCESSING, createdPayment.status());
		assertNotNull(createdPayment.paymentId());

		var firstPoll = paymentService.getPayment(createdPayment.paymentId());
		assertEquals(PROCESSING, firstPoll.status());

		var secondPoll = paymentService.getPayment(createdPayment.paymentId());
		assertEquals(SUCCESS, secondPoll.status());
		assertEquals("UPI ID: aarav@upi", secondPoll.maskedInstrument());

		var receipt = paymentService.getReceipt(createdPayment.paymentId());
		assertEquals(SUCCESS, receipt.status());
		assertNotNull(receipt.receiptNumber());
	}

	@Test
	void rejectsUpiPaymentWithoutUpiId() throws Exception {
		PaymentRequest request = new PaymentRequest(
			"ORD-1002",
			"Aarav Sharma",
			"aarav@example.com",
			BigDecimal.valueOf(2499),
			"INR",
			UPI,
			SimulationMode.SUCCESS,
			null,
			null,
			null,
			null,
			null,
			null,
			null
		);

		ResponseStatusException exception = assertThrows(
			ResponseStatusException.class,
			() -> paymentService.createPayment(request)
		);

		assertEquals("400 BAD_REQUEST \"UPI ID is required for UPI payments.\"", exception.getMessage());
	}

	@Test
	void returnsFailedStatusForFailedSimulation() throws Exception {
		PaymentRequest request = new PaymentRequest(
			"ORD-1003",
			"Aarav Sharma",
			"aarav@example.com",
			BigDecimal.valueOf(2499),
			"INR",
			UPI,
			SimulationMode.FAILED,
			"aarav@upi",
			null,
			null,
			null,
			null,
			null,
			null
		);

		var createdPayment = paymentService.createPayment(request);
		paymentService.getPayment(createdPayment.paymentId());
		var finalPayment = paymentService.getPayment(createdPayment.paymentId());

		assertEquals(FAILED, finalPayment.status());
		assertNotNull(finalPayment.failureReason());
	}

}
