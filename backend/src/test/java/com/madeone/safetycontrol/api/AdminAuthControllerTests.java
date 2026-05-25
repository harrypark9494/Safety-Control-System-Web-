package com.madeone.safetycontrol.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.madeone.safetycontrol.SafetyControlBackendApplication;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@SpringBootTest(
	classes = {
		SafetyControlBackendApplication.class,
		AdminAuthControllerTests.AdminAuthTestConfig.class
	},
	properties = "admin.auth.allowed-emails=admin@example.com"
)
@AutoConfigureMockMvc
class AdminAuthControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void acceptsAllowedVerifiedAdminEmail() throws Exception {
		mockMvc.perform(post("/api/auth/admin-login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(""" 
					{
					  "idToken": "valid-admin"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.role").value("admin"))
			.andExpect(jsonPath("$.email").value("admin@example.com"))
			.andExpect(jsonPath("$.name").value("관리자"));
	}

	@Test
	void rejectsUnverifiedEmail() throws Exception {
		mockMvc.perform(post("/api/auth/admin-login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(""" 
					{
					  "idToken": "unverified-admin"
					}
					"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void rejectsEmailOutsideAllowlist() throws Exception {
		mockMvc.perform(post("/api/auth/admin-login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(""" 
					{
					  "idToken": "other-admin"
					}
					"""))
			.andExpect(status().isForbidden());
	}

	@TestConfiguration
	static class AdminAuthTestConfig {

		@Bean
		@Primary
		AdminTokenVerifier adminTokenVerifier() {
			return idToken -> switch (idToken) {
				case "valid-admin" -> new AdminIdentity("firebase-admin-1", "admin@example.com", "관리자", true);
				case "unverified-admin" -> new AdminIdentity("firebase-admin-2", "admin@example.com", "관리자", false);
				case "other-admin" -> new AdminIdentity("firebase-admin-3", "other@example.com", "외부 관리자", true);
				default -> throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "관리자 로그인 토큰을 확인할 수 없습니다.");
			};
		}
	}
}
