import { HttpStatus, Injectable } from '@nestjs/common';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ApiError } from '../shared/api-error';

interface AdminIdentity {
  uid: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
}

@Injectable()
export class AdminAuthService {
  async login(idToken: string) {
    const identity = await this.verifyToken(idToken);
    const email = this.normalizeEmail(identity.email);

    if (!email) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'ADMIN_EMAIL_MISSING', '관리자 이메일 정보를 확인할 수 없습니다.');
    }

    if (!identity.emailVerified) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'ADMIN_EMAIL_UNVERIFIED', '이메일 인증이 완료된 관리자 계정만 사용할 수 있습니다.');
    }

    if (!this.isAllowed(email)) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'ADMIN_NOT_ALLOWED', '허용된 관리자 계정이 아닙니다.');
    }

    return {
      uid: identity.uid,
      role: 'admin',
      name: this.displayName(identity.name, email),
      email,
    };
  }

  private async verifyToken(idToken: string): Promise<AdminIdentity> {
    this.ensureFirebaseApp();

    try {
      const token = await getAuth().verifyIdToken(idToken);
      return {
        uid: token.uid,
        email: token.email,
        name: token.name,
        emailVerified: token.email_verified,
      };
    } catch (error) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'ADMIN_TOKEN_INVALID',
        '관리자 로그인 토큰을 확인할 수 없습니다.',
        { cause: error instanceof Error ? error.message : 'unknown' },
      );
    }
  }

  private ensureFirebaseApp() {
    if (getApps().length > 0) {
      return;
    }

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!credentialsPath && !projectId) {
      throw new ApiError(HttpStatus.SERVICE_UNAVAILABLE, 'FIREBASE_ADMIN_NOT_CONFIGURED', 'Firebase Admin SDK 설정이 필요합니다.');
    }

    initializeApp({
      credential: credentialsPath ? cert(credentialsPath) : applicationDefault(),
      projectId,
    });
  }

  private isAllowed(email: string) {
    const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((value) => this.normalizeEmail(value))
      .filter(Boolean);
    const allowedDomain = this.normalizeDomain(process.env.ADMIN_ALLOWED_DOMAIN);

    if (allowedEmails.length > 0) {
      return allowedEmails.includes(email);
    }

    if (allowedDomain) {
      return email.endsWith(`@${allowedDomain}`);
    }

    throw new ApiError(HttpStatus.SERVICE_UNAVAILABLE, 'ADMIN_ALLOWLIST_NOT_CONFIGURED', '관리자 허용 이메일 또는 도메인 설정이 필요합니다.');
  }

  private normalizeEmail(email: string | undefined) {
    return (email ?? '').trim().toLowerCase();
  }

  private normalizeDomain(domain: string | undefined) {
    const normalized = (domain ?? '').trim().toLowerCase();
    return normalized.startsWith('@') ? normalized.slice(1) : normalized;
  }

  private displayName(name: string | undefined, email: string) {
    if (name?.trim()) {
      return name.trim();
    }

    const separator = email.indexOf('@');
    return separator > 0 ? email.slice(0, separator) : email;
  }
}
