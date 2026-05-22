package com.madeone.safetycontrol.domain;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkerRegistrationRepository extends JpaRepository<WorkerRegistration, String> {

	Optional<WorkerRegistration> findByPhone(String phone);

	List<WorkerRegistration> findAllByOrderByRequestedAtDesc();
}
