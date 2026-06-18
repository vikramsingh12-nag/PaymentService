package com.paymentservice.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class BackendServiceApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void createsPaymentAndTransitionsToSuccess() throws Exception {
		Map<String, Object> request = Map.of(
			"orderId", "ORD-1001",
			"customerName", "Aarav Sharma",
			"customerEmail", "aarav@example.com",
			"amount", 2499,
			"currency", "INR",
			"paymentMethod", "UPI",
			"simulationMode", "SUCCESS",
			"upiId", "aarav@upi"
		);

		MvcResult createResult = mockMvc.perform(post("/api/payments")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsBytes(request)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.status").value("PROCESSING"))
			.andReturn();

		JsonNode createPayload = objectMapper.readTree(createResult.getResponse().getContentAsByteArray());
		String paymentId = createPayload.get("paymentId").asText();

		mockMvc.perform(get("/api/payments/{paymentId}", paymentId))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("PROCESSING"));

		mockMvc.perform(get("/api/payments/{paymentId}", paymentId))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("SUCCESS"));

		mockMvc.perform(get("/api/payments/{paymentId}/receipt", paymentId))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.paymentId").value(paymentId))
			.andExpect(jsonPath("$.receiptNumber").isNotEmpty());
	}

	@Test
	void rejectsUpiPaymentWithoutUpiId() throws Exception {
		Map<String, Object> request = Map.of(
			"orderId", "ORD-1002",
			"customerName", "Aarav Sharma",
			"customerEmail", "aarav@example.com",
			"amount", 2499,
			"currency", "INR",
			"paymentMethod", "UPI",
			"simulationMode", "SUCCESS"
		);

		mockMvc.perform(post("/api/payments")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsBytes(request)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("UPI ID is required for UPI payments."));
	}

}
