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

	@Column(length = 120)
	private String passwordHash;

	@Column(length = 40)
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
	private Instant registeredAt;

	private Instant onboardedAt;

	protected WorkerRegistration() {
	}

	public WorkerRegistration(
		String name,
		String phone,
		String workType,
		String team,
		String supervisor,
		String payrollDocumentStatus
	) {
		this.name = name;
		this.phone = phone;
		this.workType = workType;
		this.team = team;
		this.supervisor = supervisor;
		this.registrationStatus = "registered";
		this.payrollDocumentStatus = payrollDocumentStatus;
	}

	@PrePersist
	void beforeCreate() {
		if (uid == null) {
			uid = UUID.randomUUID().toString();
		}
		if (registeredAt == null) {
			registeredAt = Instant.now();
		}
	}

	public void updateRegistration(
		String name,
		String workType,
		String team,
		String supervisor,
		String payrollDocumentStatus
	) {
		this.name = name;
		this.workType = workType;
		this.team = team;
		this.supervisor = supervisor;
		this.registrationStatus = "registered";
		this.payrollDocumentStatus = payrollDocumentStatus;
		this.registeredAt = Instant.now();
		this.onboardedAt = null;
		this.passwordHash = null;
		this.verificationCode = null;
	}

	public void completeOnboarding(String passwordHash, String verificationCode) {
		this.passwordHash = passwordHash;
		this.verificationCode = verificationCode;
		this.registrationStatus = "onboarded";
		this.onboardedAt = Instant.now();
	}

	public void changeWorkType(String workType) {
		this.workType = workType;
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

	public Instant getRegisteredAt() {
		return registeredAt;
	}

	public Instant getOnboardedAt() {
		return onboardedAt;
	}
}
