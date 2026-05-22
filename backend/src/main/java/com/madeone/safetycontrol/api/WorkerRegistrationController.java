package com.madeone.safetycontrol.api;

import java.time.Instant;
import java.util.List;

import com.madeone.safetycontrol.domain.WorkerRegistration;
import com.madeone.safetycontrol.domain.WorkerRegistrationRepository;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
class WorkerRegistrationController {

	private final WorkerRegistrationService registrations;

	WorkerRegistrationController(WorkerRegistrationService registrations) {
		this.registrations = registrations;
	}

	@PostMapping("/api/worker-registrations")
	RegistrationResponse requestRegistration(@Valid @RequestBody RegistrationRequest request) {
		return registrations.requestRegistration(request);
	}

	@PostMapping("/api/auth/worker-login")
	WorkerLoginResponse workerLogin(@Valid @RequestBody WorkerLoginRequest request) {
		return registrations.login(request);
	}

	@GetMapping("/api/admin/worker-registrations")
	List<RegistrationResponse> listRegistrations() {
		return registrations.list();
	}

	@PostMapping("/api/admin/worker-registrations/{phone}/approve")
	RegistrationResponse approveRegistration(@PathVariable String phone) {
		return registrations.approve(phone);
	}

	@PostMapping("/api/admin/worker-registrations/{phone}/reject")
	RegistrationResponse rejectRegistration(@PathVariable String phone) {
		return registrations.reject(phone);
	}

	record RegistrationRequest(
		@NotBlank String name,
		@NotBlank String phone,
		@NotBlank String code,
		@Size(min = 8) String password,
		@NotBlank String workType
	) {
	}

	record WorkerLoginRequest(
		@NotBlank String name,
		@NotBlank String phone,
		@NotBlank String code,
		@NotBlank String password
	) {
	}

	record RegistrationResponse(
		String uid,
		String name,
		String phone,
		String workType,
		String team,
		String supervisor,
		String registrationStatus,
		String payrollDocumentStatus,
		Instant requestedAt,
		Instant approvedAt,
		Instant rejectedAt
	) {
	}

	record WorkerLoginResponse(
		String uid,
		String role,
		String name,
		String phone,
		String workType,
		String team,
		String supervisor,
		String schedule,
		String status,
		boolean payrollDocumentsRequired,
		String payrollDocumentStatus
	) {
	}
}

@org.springframework.stereotype.Service
class WorkerRegistrationService {

	private final WorkerRegistrationRepository registrations;
	private final PasswordEncoder passwordEncoder;

	WorkerRegistrationService(WorkerRegistrationRepository registrations, PasswordEncoder passwordEncoder) {
		this.registrations = registrations;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	WorkerRegistrationController.RegistrationResponse requestRegistration(
		WorkerRegistrationController.RegistrationRequest request
	) {
		WorkerRegistration worker = registrations.findByPhone(request.phone())
			.map(existing -> {
				if ("approved".equals(existing.getRegistrationStatus())) {
					throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 승인된 등록 정보입니다.");
				}
				existing.updateRequest(
					request.name().trim(),
					passwordEncoder.encode(request.password()),
					request.code(),
					request.workType()
				);
				return existing;
			})
			.orElseGet(() -> new WorkerRegistration(
				request.name().trim(),
				request.phone(),
				passwordEncoder.encode(request.password()),
				request.code(),
				request.workType(),
				"직접 고용".equals(request.workType()) ? "직접 고용 확인 대기" : "협력사 확인 대기",
				"관리자 배정 전",
				"pending",
				"직접 고용".equals(request.workType()) ? "missing" : "approved"
			));

		return toResponse(registrations.save(worker));
	}

	List<WorkerRegistrationController.RegistrationResponse> list() {
		return registrations.findAllByOrderByRequestedAtDesc().stream()
			.map(this::toResponse)
			.toList();
	}

	@Transactional
	WorkerRegistrationController.RegistrationResponse approve(String phone) {
		WorkerRegistration worker = find(phone);
		worker.approve();
		return toResponse(worker);
	}

	@Transactional
	WorkerRegistrationController.RegistrationResponse reject(String phone) {
		WorkerRegistration worker = find(phone);
		worker.reject();
		return toResponse(worker);
	}

	WorkerRegistrationController.WorkerLoginResponse login(WorkerRegistrationController.WorkerLoginRequest request) {
		WorkerRegistration worker = find(request.phone());

		if (!worker.getName().equals(request.name().trim())
			|| !worker.getVerificationCode().equals(request.code())
			|| !passwordEncoder.matches(request.password(), worker.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "등록 정보가 일치하지 않습니다.");
		}

		if ("pending".equals(worker.getRegistrationStatus())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 승인 전입니다.");
		}

		if ("rejected".equals(worker.getRegistrationStatus())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "등록 요청이 반려되었습니다.");
		}

		return new WorkerRegistrationController.WorkerLoginResponse(
			worker.getUid(),
			"worker",
			worker.getName(),
			worker.getPhone(),
			worker.getWorkType(),
			worker.getTeam(),
			worker.getSupervisor(),
			"근무 일정 배정 전",
			"등록 승인",
			"직접 고용".equals(worker.getWorkType()) && "missing".equals(worker.getPayrollDocumentStatus()),
			worker.getPayrollDocumentStatus()
		);
	}

	private WorkerRegistration find(String phone) {
		return registrations.findByPhone(phone)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등록 정보를 찾을 수 없습니다."));
	}

	private WorkerRegistrationController.RegistrationResponse toResponse(WorkerRegistration worker) {
		return new WorkerRegistrationController.RegistrationResponse(
			worker.getUid(),
			worker.getName(),
			worker.getPhone(),
			worker.getWorkType(),
			worker.getTeam(),
			worker.getSupervisor(),
			worker.getRegistrationStatus(),
			worker.getPayrollDocumentStatus(),
			worker.getRequestedAt(),
			worker.getApprovedAt(),
			worker.getRejectedAt()
		);
	}
}
