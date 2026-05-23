package com.madeone.safetycontrol.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "work_types")
public class WorkTypeSetting {

	@Id
	@Column(nullable = false, length = 40)
	private String label;

	@Column(nullable = false)
	private boolean enabled;

	@Column(nullable = false)
	private boolean payrollDocumentsRequired;

	@Column(nullable = false)
	private int sortOrder;

	@Column(nullable = false)
	private Instant updatedAt;

	protected WorkTypeSetting() {
	}

	public WorkTypeSetting(String label, boolean enabled, boolean payrollDocumentsRequired, int sortOrder) {
		this.label = label;
		this.enabled = enabled;
		this.payrollDocumentsRequired = payrollDocumentsRequired;
		this.sortOrder = sortOrder;
	}

	@PrePersist
	@PreUpdate
	void beforeSave() {
		updatedAt = Instant.now();
	}

	public void update(boolean enabled, boolean payrollDocumentsRequired, int sortOrder) {
		this.enabled = enabled;
		this.payrollDocumentsRequired = payrollDocumentsRequired;
		this.sortOrder = sortOrder;
	}

	public String getLabel() {
		return label;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public boolean isPayrollDocumentsRequired() {
		return payrollDocumentsRequired;
	}

	public int getSortOrder() {
		return sortOrder;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
