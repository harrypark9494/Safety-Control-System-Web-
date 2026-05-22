package com.madeone.safetycontrol;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.madeone.safetycontrol.domain.WorkerRegistrationRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SafetyControlBackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private WorkerRegistrationRepository registrations;

	@BeforeEach
	void cleanRegistrations() {
		registrations.deleteAll();
	}

	@Test
	void contextLoads() {
	}

	@Test
	void normalizesPhoneAcrossRegistrationOnboardingAndLogin() throws Exception {
		mockMvc.perform(post("/api/admin/worker-registrations")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "name": "테스트 근로자",
					  "phone": "01012345678",
					  "workType": "직접 고용",
					  "team": "Stage Alpha",
					  "supervisor": "관리자 A"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.phone").value("010-1234-5678"));

		mockMvc.perform(post("/api/worker-registrations")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "name": "테스트 근로자",
					  "phone": "010-1234-5678",
					  "code": "123456",
					  "password": "password123",
					  "workType": "직접 고용"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.registrationStatus").value("onboarded"));

		mockMvc.perform(post("/api/auth/worker-login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "name": "테스트 근로자",
					  "phone": "01012345678",
					  "code": "123456",
					  "password": "password123"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.phone").value("010-1234-5678"));
	}

	@Test
	void rejectsUnsupportedWorkType() throws Exception {
		mockMvc.perform(post("/api/admin/worker-registrations")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "name": "테스트 근로자",
					  "phone": "01012345678",
					  "workType": "프리랜서",
					  "team": "Stage Alpha",
					  "supervisor": "관리자 A"
					}
					"""))
			.andExpect(status().isBadRequest());
	}
}
