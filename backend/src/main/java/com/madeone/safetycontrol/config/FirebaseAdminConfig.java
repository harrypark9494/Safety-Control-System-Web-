package com.madeone.safetycontrol.config;

import java.io.IOException;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FirebaseAdminConfig {

	@Bean
	@ConditionalOnProperty(name = "firebase.admin.enabled", havingValue = "true")
	FirebaseAuth firebaseAuth(@Value("${firebase.admin.project-id:}") String projectId) throws IOException {
		FirebaseOptions.Builder options = FirebaseOptions.builder()
			.setCredentials(GoogleCredentials.getApplicationDefault());

		if (!projectId.isBlank()) {
			options.setProjectId(projectId);
		}

		FirebaseApp app = FirebaseApp.getApps().stream()
			.findFirst()
			.orElseGet(() -> FirebaseApp.initializeApp(options.build()));

		return FirebaseAuth.getInstance(app);
	}
}
