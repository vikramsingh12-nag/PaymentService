package com.paymentservice.backend.payments;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException exception) {
		Map<String, String> body = new LinkedHashMap<>();
		body.put("message", exception.getReason() == null ? "Request failed." : exception.getReason());
		return ResponseEntity.status(exception.getStatusCode()).body(body);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException exception) {
		String message = exception.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(FieldError::getDefaultMessage)
			.collect(Collectors.joining(" "));

		Map<String, String> body = new LinkedHashMap<>();
		body.put("message", message.isBlank() ? "Validation failed." : message);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
	}
}
