package com.madeone.safetycontrol.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "worker_registrations")
public class WorkerRegistration {

	@Id
	@Column(nullable = false, updatable = false, length = 36)
	private String uid;

	@Column(nullable = false, length = 80)
	private String name;

	@Column(nullable = false, unique = true, length = 20)
	private String phone;

	@Column(nullable = false, length = 120)
	private String passwordHash;

	@Column(nullable = false, length = 40)
	private String verificationCode;

	@Column(nullable = false, length = 30)
	private String workType;

	@Column(nullable = false, length = 80)
	private String team;

	@Column(nullable = false, length = 80)
	private String supervisor;

	@Column(nullable = false, length = 20)
	private String registrationStatus;

	@Column(nullable = false, length = 20)
	private String payrollDocumentStatus;

	@Column(nullable = false)
	private Instant requestedAt;

	private Instant approvedAt;

	private Instant rejectedAt;

	protected WorkerRegistration() {
	}

	public WorkerRegistration(
		String name,
		String phone,
		String passwordHash,
		String verificationCode,
		String workType,
		String team,
		String supervisor,
		String registrationStatus,
		String payrollDocumentStatus
	) {
		this.name = name;
		this.phone = phone;
		this.passwordHash = passwordHash;
		this.verificationCode = verificationCode;
		this.workType = workType;
		this.team = team;
		this.supervisor = supervisor;
		this.registrationStatus = registrationStatus;
		this.payrollDocumentStatus = payrollDocumentStatus;
	}

	@PrePersist
	void beforeCreate() {
		if (uid == null) {
			uid = UUID.randomUUID().toString();
		}
		if (requestedAt == null) {
			requestedAt = Instant.now();
		}
	}

	public void updateRequest(String name, String passwordHash, String verificationCode, String workType) {
		this.name = name;
		this.passwordHash = passwordHash;
		this.verificationCode = verificationCode;
		this.workType = workType;
		this.team = "직접 고용".equals(workType) ? "직접 고용 확인 대기" : "협력사 확인 대기";
		this.supervisor = "관리자 배정 전";
		this.registrationStatus = "pending";
		this.payrollDocumentStatus = "직접 고용".equals(workType) ? "missing" : "approved";
		this.requestedAt = Instant.now();
		this.approvedAt = null;
		this.rejectedAt = null;
	}

	public void approve() {
		this.registrationStatus = "approved";
		this.approvedAt = Instant.now();
		this.rejectedAt = null;
	}

	public void reject() {
		this.registrationStatus = "rejected";
		this.rejectedAt = Instant.now();
	}

	public String getUid() {
		return uid;
	}

	public String getName() {
		return name;
	}

	public String getPhone() {
		return phone;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getVerificationCode() {
		return verificationCode;
	}

	public String getWorkType() {
		return workType;
	}

	public String getTeam() {
		return team;
	}

	public String getSupervisor() {
		return supervisor;
	}

	public String getRegistrationStatus() {
		return registrationStatus;
	}

	public String getPayrollDocumentStatus() {
		return payrollDocumentStatus;
	}

	public Instant getRequestedAt() {
		return requestedAt;
	}

	public Instant getApprovedAt() {
		return approvedAt;
	}

	public Instant getRejectedAt() {
		return rejectedAt;
	}
}
