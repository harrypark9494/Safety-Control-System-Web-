package com.madeone.safetycontrol.api;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
class AdminAuthController {

	private final AdminAuthService adminAuth;

	AdminAuthController(AdminAuthService adminAuth) {
		this.adminAuth = adminAuth;
	}

	@PostMapping("/api/auth/admin-login")
	AdminLoginResponse adminLogin(@Valid @RequestBody AdminLoginRequest request) {
		return adminAuth.login(request.idToken());
	}

	record AdminLoginRequest(@NotBlank String idToken) {
	}

	record AdminLoginResponse(
		String uid,
		String role,
		String name,
		String email
	) {
	}
}

@Service
class AdminAuthService {

	private final AdminTokenVerifier tokenVerifier;
	private final Set<String> allowedEmails;
	private final String allowedDomain;

	AdminAuthService(
		AdminTokenVerifier tokenVerifier,
		@Value("${admin.auth.allowed-emails:}") String allowedEmails,
		@Value("${admin.auth.allowed-domain:}") String allowedDomain
	) {
		this.tokenVerifier = tokenVerifier;
		this.allowedEmails = parseEmails(allowedEmails);
		this.allowedDomain = normalizeDomain(allowedDomain);
	}

	AdminAuthController.AdminLoginResponse login(String idToken) {
		AdminIdentity identity = tokenVerifier.verify(idToken);
		String email = normalizeEmail(identity.email());

		if (email.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "관리자 이메일 정보를 확인할 수 없습니다.");
		}

		if (!identity.emailVerified()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 인증이 완료된 관리자 계정만 사용할 수 있습니다.");
		}

		if (!isAllowed(email)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "허용된 관리자 계정이 아닙니다.");
		}

		return new AdminAuthController.AdminLoginResponse(
			identity.uid(),
			"admin",
			displayName(identity.name(), email),
			email
		);
	}

	private boolean isAllowed(String email) {
		if (!allowedEmails.isEmpty()) {
			return allowedEmails.contains(email);
		}

		if (!allowedDomain.isBlank()) {
			return email.endsWith("@" + allowedDomain);
		}

		throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "관리자 허용 이메일 또는 도메인 설정이 필요합니다.");
	}

	private Set<String> parseEmails(String value) {
		return Arrays.stream(value.split(","))
			.map(this::normalizeEmail)
			.filter(email -> !email.isBlank())
			.collect(Collectors.toUnmodifiableSet());
	}

	private String normalizeEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}

	private String normalizeDomain(String domain) {
		String normalized = domain == null ? "" : domain.trim().toLowerCase(Locale.ROOT);
		return normalized.startsWith("@") ? normalized.substring(1) : normalized;
	}

	private String displayName(String name, String email) {
		if (name != null && !name.isBlank()) {
			return name.trim();
		}

		int separator = email.indexOf('@');
		return separator > 0 ? email.substring(0, separator) : email;
	}
}

interface AdminTokenVerifier {
	AdminIdentity verify(String idToken);
}

record AdminIdentity(
	String uid,
	String email,
	String name,
	boolean emailVerified
) {
}

@Service
class FirebaseAdminTokenVerifier implements AdminTokenVerifier {

	private final ObjectProvider<FirebaseAuth> firebaseAuth;

	FirebaseAdminTokenVerifier(ObjectProvider<FirebaseAuth> firebaseAuth) {
		this.firebaseAuth = firebaseAuth;
	}

	@Override
	public AdminIdentity verify(String idToken) {
		FirebaseAuth auth = firebaseAuth.getIfAvailable();

		if (auth == null) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firebase Admin SDK 설정이 필요합니다.");
		}

		try {
			FirebaseToken token = auth.verifyIdToken(idToken);
			return new AdminIdentity(
				token.getUid(),
				token.getEmail(),
				token.getName(),
				token.isEmailVerified()
			);
		} catch (FirebaseAuthException exception) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "관리자 로그인 토큰을 확인할 수 없습니다.", exception);
		}
	}
}
