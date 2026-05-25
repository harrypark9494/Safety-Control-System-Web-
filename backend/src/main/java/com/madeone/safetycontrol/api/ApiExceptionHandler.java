package com.madeone.safetycontrol.api;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
class ApiExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException exception) {
		HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
		return ResponseEntity.status(status).body(Map.of(
			"code", status.name(),
			"message", exception.getReason() == null ? status.getReasonPhrase() : exception.getReason(),
			"details", Map.of()
		));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
		String message = exception.getBindingResult().getFieldErrors().stream()
			.findFirst()
			.map(error -> error.getField() + " 입력값을 확인해 주세요.")
			.orElse("입력값을 확인해 주세요.");

		return ResponseEntity.badRequest().body(Map.of(
			"code", "BAD_REQUEST",
			"message", message,
			"details", Map.of()
		));
	}
}
