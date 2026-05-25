package com.madeone.safetycontrol.config;

import com.madeone.safetycontrol.domain.WorkerRegistration;
import com.madeone.safetycontrol.domain.WorkerRegistrationRepository;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LocalDevDataSeeder {

	@Bean
	@ConditionalOnProperty(name = "app.dev-seed.enabled", havingValue = "true", matchIfMissing = true)
	ApplicationRunner seedLocalWorkerRegistration(WorkerRegistrationRepository registrations) {
		return args -> registrations.findByPhone("010-1234-5678")
			.orElseGet(() -> registrations.save(new WorkerRegistration(
				"테스트 근로자",
				"010-1234-5678",
				"직접 고용",
				"Stage Alpha",
				"관리자 A",
				"missing"
			)));
	}
}
