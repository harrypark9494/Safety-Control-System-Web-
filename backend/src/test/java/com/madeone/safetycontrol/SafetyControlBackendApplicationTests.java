package com.madeone.safetycontrol;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.madeone.safetycontrol.domain.WorkTypeSetting;
import com.madeone.safetycontrol.domain.WorkTypeSettingRepository;
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

	@Autowired
	private WorkTypeSettingRepository workTypes;

	@BeforeEach
	void resetData() {
		registrations.deleteAll();
		workTypes.deleteAll();
		workTypes.save(new WorkTypeSetting("직접 고용", true, true, 10));
		workTypes.save(new WorkTypeSetting("외부 고용", true, false, 20));
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

	@Test
	void supportsAdminManagedWorkTypesAndPayrollRequirement() throws Exception {
		mockMvc.perform(post("/api/admin/work-types")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "label": "단기 아르바이트",
					  "enabled": true,
					  "payrollDocumentsRequired": true,
					  "sortOrder": 15
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.label").value("단기 아르바이트"))
			.andExpect(jsonPath("$.payrollDocumentsRequired").value(true));

		mockMvc.perform(get("/api/work-types"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(3)));

		mockMvc.perform(post("/api/admin/worker-registrations")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "name": "단기 근로자",
					  "phone": "01088889999",
					  "workType": "단기 아르바이트",
					  "team": "Stage Bravo",
					  "supervisor": "관리자 B"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.payrollDocumentStatus").value("missing"));

		mockMvc.perform(post("/api/worker-registrations")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "name": "단기 근로자",
					  "phone": "010-8888-9999",
					  "code": "654321",
					  "password": "password123",
					  "workType": "단기 아르바이트"
					}
					"""))
			.andExpect(status().isOk());

		mockMvc.perform(post("/api/auth/worker-login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "name": "단기 근로자",
					  "phone": "01088889999",
					  "code": "654321",
					  "password": "password123"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.workType").value("단기 아르바이트"))
			.andExpect(jsonPath("$.payrollDocumentsRequired").value(true));
	}
}
