package com.madeone.safetycontrol.api;

import java.time.Instant;
import java.util.List;

import com.madeone.safetycontrol.domain.WorkTypeSetting;
import com.madeone.safetycontrol.domain.WorkTypeSettingRepository;
import com.madeone.safetycontrol.domain.WorkerRegistration;
import com.madeone.safetycontrol.domain.WorkerRegistrationRepository;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
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
	RegistrationResponse completeOnboarding(@Valid @RequestBody OnboardingRequest request) {
		return registrations.completeOnboarding(request);
	}

	@PostMapping("/api/auth/worker-login")
	WorkerLoginResponse workerLogin(@Valid @RequestBody WorkerLoginRequest request) {
		return registrations.login(request);
	}

	@GetMapping("/api/admin/worker-registrations")
	List<RegistrationResponse> listRegistrations() {
		return registrations.list();
	}

	@GetMapping("/api/work-types")
	List<WorkTypeResponse> listEnabledWorkTypes() {
		return registrations.listEnabledWorkTypes();
	}

	@GetMapping("/api/admin/work-types")
	List<WorkTypeResponse> listWorkTypes() {
		return registrations.listWorkTypes();
	}

	@PostMapping("/api/admin/work-types")
	WorkTypeResponse saveWorkType(@Valid @RequestBody WorkTypeRequest request) {
		return registrations.saveWorkType(request);
	}

	@PostMapping("/api/admin/worker-registrations")
	RegistrationResponse createRegistration(@Valid @RequestBody AdminRegistrationRequest request) {
		return registrations.createRegistration(request);
	}

	@DeleteMapping("/api/admin/worker-registrations/{phone}")
	void deleteRegistration(@PathVariable String phone) {
		registrations.delete(phone);
	}

	record AdminRegistrationRequest(
		@NotBlank String name,
		@NotBlank String phone,
		@NotBlank String workType,
		@NotBlank String team,
		@NotBlank String supervisor
	) {
	}

	record OnboardingRequest(
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
		Instant registeredAt,
		Instant onboardedAt
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

	record WorkTypeRequest(
		@NotBlank String label,
		boolean enabled,
		boolean payrollDocumentsRequired,
		int sortOrder
	) {
	}

	record WorkTypeResponse(
		String label,
		boolean enabled,
		boolean payrollDocumentsRequired,
		int sortOrder,
		Instant updatedAt
	) {
	}
}

@org.springframework.stereotype.Service
class WorkerRegistrationService {

	private final WorkerRegistrationRepository registrations;
	private final WorkTypeSettingRepository workTypes;
	private final PasswordEncoder passwordEncoder;

	WorkerRegistrationService(
		WorkerRegistrationRepository registrations,
		WorkTypeSettingRepository workTypes,
		PasswordEncoder passwordEncoder
	) {
		this.registrations = registrations;
		this.workTypes = workTypes;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	WorkerRegistrationController.RegistrationResponse createRegistration(
		WorkerRegistrationController.AdminRegistrationRequest request
	) {
		String phone = normalizePhone(request.phone());
		String workType = normalizeWorkType(request.workType());

		WorkerRegistration worker = registrations.findByPhone(phone)
			.map(existing -> {
				existing.updateRegistration(
					request.name().trim(),
					workType,
					request.team().trim(),
					request.supervisor().trim(),
					initialPayrollDocumentStatus(workType)
				);
				return existing;
			})
			.orElseGet(() -> new WorkerRegistration(
				request.name().trim(),
				phone,
				workType,
				request.team().trim(),
				request.supervisor().trim(),
				initialPayrollDocumentStatus(workType)
			));

		return toResponse(registrations.save(worker));
	}

	@Transactional
	WorkerRegistrationController.RegistrationResponse completeOnboarding(
		WorkerRegistrationController.OnboardingRequest request
	) {
		String workType = normalizeWorkType(request.workType());
		WorkerRegistration worker = find(request.phone());

		if (!worker.getName().equals(request.name().trim()) || !worker.getWorkType().equals(workType)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자가 등록한 근로자 정보와 일치하지 않습니다.");
		}

		worker.completeOnboarding(passwordEncoder.encode(request.password()), request.code().trim());
		return toResponse(worker);
	}

	List<WorkerRegistrationController.RegistrationResponse> list() {
		return registrations.findAllByOrderByRegisteredAtDesc().stream()
			.map(this::toResponse)
			.toList();
	}

	@Transactional
	void delete(String phone) {
		WorkerRegistration worker = find(phone);
		registrations.delete(worker);
	}

	WorkerRegistrationController.WorkerLoginResponse login(WorkerRegistrationController.WorkerLoginRequest request) {
		WorkerRegistration worker = find(request.phone());

		if (!"onboarded".equals(worker.getRegistrationStatus())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "회원가입 절차가 완료되지 않았습니다.");
		}

		if (!worker.getName().equals(request.name().trim())
			|| !worker.getVerificationCode().equals(request.code())
			|| !passwordEncoder.matches(request.password(), worker.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "등록 정보가 일치하지 않습니다.");
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
			"온보딩 완료",
			isPayrollDocumentRequired(worker.getWorkType()) && "missing".equals(worker.getPayrollDocumentStatus()),
			worker.getPayrollDocumentStatus()
		);
	}

	List<WorkerRegistrationController.WorkTypeResponse> listEnabledWorkTypes() {
		return workTypes.findByEnabledTrueOrderBySortOrderAscLabelAsc().stream()
			.map(this::toWorkTypeResponse)
			.toList();
	}

	List<WorkerRegistrationController.WorkTypeResponse> listWorkTypes() {
		return workTypes.findAllByOrderBySortOrderAscLabelAsc().stream()
			.map(this::toWorkTypeResponse)
			.toList();
	}

	@Transactional
	WorkerRegistrationController.WorkTypeResponse saveWorkType(WorkerRegistrationController.WorkTypeRequest request) {
		String label = normalizeWorkTypeLabel(request.label());
		WorkTypeSetting workType = workTypes.findById(label)
			.orElseGet(() -> new WorkTypeSetting(label, request.enabled(), request.payrollDocumentsRequired(), request.sortOrder()));

		workType.update(request.enabled(), request.payrollDocumentsRequired(), request.sortOrder());
		return toWorkTypeResponse(workTypes.save(workType));
	}

	private WorkerRegistration find(String phone) {
		return registrations.findByPhone(normalizePhone(phone))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "관리자가 등록한 근로자 정보를 찾을 수 없습니다."));
	}

	private String normalizePhone(String phone) {
		String digits = phone == null ? "" : phone.replaceAll("\\D", "");

		if (digits.length() == 11) {
			return digits.substring(0, 3) + "-" + digits.substring(3, 7) + "-" + digits.substring(7);
		}

		if (digits.length() == 10) {
			return digits.substring(0, 3) + "-" + digits.substring(3, 6) + "-" + digits.substring(6);
		}

		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연락처는 숫자 10자리 또는 11자리여야 합니다.");
	}

	private String normalizeWorkType(String workType) {
		String normalized = normalizeWorkTypeLabel(workType);

		if (workTypes.existsById(normalized)) {
			return normalized;
		}

		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 고용 유형입니다.");
	}

	private String normalizeWorkTypeLabel(String workType) {
		String normalized = workType == null ? "" : workType.trim();

		if (normalized.isEmpty() || normalized.length() > 40) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "고용 유형은 1자 이상 40자 이하여야 합니다.");
		}

		return normalized;
	}

	private String initialPayrollDocumentStatus(String workType) {
		return isPayrollDocumentRequired(workType) ? "missing" : "approved";
	}

	private boolean isPayrollDocumentRequired(String workType) {
		return workTypes.findById(workType)
			.map(WorkTypeSetting::isPayrollDocumentsRequired)
			.orElse(false);
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
			worker.getRegisteredAt(),
			worker.getOnboardedAt()
		);
	}

	private WorkerRegistrationController.WorkTypeResponse toWorkTypeResponse(WorkTypeSetting workType) {
		return new WorkerRegistrationController.WorkTypeResponse(
			workType.getLabel(),
			workType.isEnabled(),
			workType.isPayrollDocumentsRequired(),
			workType.getSortOrder(),
			workType.getUpdatedAt()
		);
	}
}
