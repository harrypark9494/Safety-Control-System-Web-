package com.madeone.safetycontrol.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
			.csrf(AbstractHttpConfigurer::disable)
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers("/api/health", "/actuator/health", "/actuator/info").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/work-types").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/worker-login", "/api/auth/admin-login", "/api/worker-registrations").permitAll()
				.requestMatchers("/api/admin/worker-registrations/**", "/api/admin/work-types/**").permitAll()
				.requestMatchers("/api/**").authenticated()
				.anyRequest().denyAll()
			)
			.exceptionHandling(exception -> exception
				.authenticationEntryPoint((request, response, authException) ->
					response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
				)
			)
			.httpBasic(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
