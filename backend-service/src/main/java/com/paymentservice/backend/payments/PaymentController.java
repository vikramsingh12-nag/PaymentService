package com.paymentservice.backend.payments;

import static com.paymentservice.backend.payments.PaymentModels.PaymentCreatedResponse;
import static com.paymentservice.backend.payments.PaymentModels.PaymentDetailsResponse;
import static com.paymentservice.backend.payments.PaymentModels.PaymentMethodOption;
import static com.paymentservice.backend.payments.PaymentModels.PaymentRequest;
import static com.paymentservice.backend.payments.PaymentModels.ReceiptResponse;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PaymentController {

	private final PaymentService paymentService;

	public PaymentController(PaymentService paymentService) {
		this.paymentService = paymentService;
	}

	@GetMapping("/payment-methods")
	public List<PaymentMethodOption> getPaymentMethods() {
		return paymentService.getPaymentMethods();
	}

	@PostMapping("/payments")
	@ResponseStatus(HttpStatus.CREATED)
	public PaymentCreatedResponse createPayment(@Valid @RequestBody PaymentRequest request) {
		return paymentService.createPayment(request);
	}

	@GetMapping("/payments/{paymentId}")
	public PaymentDetailsResponse getPayment(@PathVariable String paymentId) {
		return paymentService.getPayment(paymentId);
	}

	@GetMapping("/payments/{paymentId}/receipt")
	public ReceiptResponse getReceipt(@PathVariable String paymentId) {
		return paymentService.getReceipt(paymentId);
	}
}
