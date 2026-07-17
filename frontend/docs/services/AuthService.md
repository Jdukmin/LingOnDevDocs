# Auth Service

`lib/auth/` 레이어 전체

---

## 역할

Google Sign-In을 통해 인증 토큰을 획득하고 Fastify 백엔드와 교환하여 앱 세션을 생성합니다.
두 가지 독립적인 흐름을 지원합니다.

---

## 인증 흐름

### 흐름 1 — ID Token (Flutter native Android/iOS)

```
Google Sign-In SDK → id_token 획득
  → POST /v1/auth/google  { id_token }
  → 백엔드: Google 서명 검증 → DB upsert → JWT 발급
  → access_token + refresh_token + user 수신
  → flutter_secure_storage 저장
```

### 흐름 2 — Authorization Code Redirect (Flutter Web / 브라우저)

```
GET /v1/auth/google  (백엔드가 Google 동의 화면으로 redirect)
  → 사용자 Google 계정 선택
  → GET /v1/auth/google/callback  (백엔드에서 처리)
  → FRONTEND_CALLBACK_URL?token=<jwt>&refresh_token=<jwt>  으로 redirect
  → 앱에서 URL 파라미터를 파싱하여 토큰 저장
```

> 흐름 2는 백엔드에 `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`,
> `FRONTEND_CALLBACK_URL` 환경 변수가 설정된 경우에만 활성화됩니다.
> 설정되지 않으면 `GET /v1/auth/google`은 `501 NOT_IMPLEMENTED`를 반환합니다.

---

## 레이어 구조

```
AuthController (presentation)
  └─ AuthRepository (domain)
       ├─ AuthApi (data)
       │    └─ ApiClient (core/network)
       └─ FlutterSecureStorage
```

### AuthController

- `ChangeNotifier` — 위젯이 구독
- `signInWithGoogle()` → Google 계정 선택 → `AuthRepository.googleLogin(idToken)`
- `signInWithGoogleRedirect()` → `GET /v1/auth/google` 로 리다이렉트 개시 (Web용)
- `handleRedirectCallback(token, refreshToken)` → URL 파라미터에서 토큰 수신 처리
- `restoreSession()` → 저장된 토큰으로 세션 복원
- `signOut()` → Google + 로컬 토큰 삭제
- `isLoading`, `isAuthenticated`, `error` 공개

### AuthRepository

- 토큰 저장·삭제: `flutter_secure_storage`
- `googleLogin(idToken)` → `AuthApi.googleLogin()` → 토큰 저장 → 프리로드
- `_preloadUserData()` — 로그인 후 4개 엔드포인트 병렬 호출

### AuthApi

- `POST /v1/auth/google` — ID Token 흐름 → `AuthTokens` 반환

---

## 호출 대상 (Route)

| 메서드 | 경로 | 흐름 | 설명 |
|--------|------|------|------|
| POST | `/v1/auth/google` | ID Token | idToken → access_token + refresh_token + user |
| GET | `/v1/auth/google` | Redirect | 백엔드가 Google 동의 화면으로 302 redirect |
| GET | `/v1/users/me` | 공통 | 로그인 후 프리로드 |
| GET | `/v1/settings/ai` | 공통 | 로그인 후 프리로드 |
| GET | `/v1/settings/ui` | 공통 | 로그인 후 프리로드 |
| GET | `/v1/apikey/status` | 공통 | 로그인 후 프리로드 |

API 상세 명세: [../../backend/docs/api/auth.md](../../backend/docs/api/auth.md)

---

## Request / Response 요약

```jsonc
// POST /v1/auth/google — ID Token 흐름
// Request
{ "id_token": "eyJh..." }

// Response (성공)
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "Display Name",
      "profile_image": "https://lh3.googleusercontent.com/..."
    }
  },
  "error": null
}

// GET /v1/auth/google — Redirect 흐름
// Response: 302 → Google 동의 화면
// (사용자 동의 후 FRONTEND_CALLBACK_URL?token=...&refresh_token=... 으로 최종 redirect)
```

> ⚠️ **API 필드명 변경**: `name` → `nickname`, `avatar_url` → `profile_image`
> 이전 구현에서 `user.name`, `user.avatar_url`을 참조하던 모든 코드를
> `user.nickname`, `user.profile_image`로 변경해야 합니다.

---

## JWT

- Access token: 1시간, `Authorization: Bearer <token>` 헤더에 포함
- Refresh token: 30일, 로컬 저장소에 보관
- Payload (디코드 시): `{ sub: userId, provider: "google", email }`
- ⚠️ `POST /v1/auth/refresh` 미구현 — 만료 시 재로그인 필요

---

## Error 처리

| 상태 | `AuthErrorKind` | UI 처리 |
|------|-----------------|---------|
| 401 | `unauthorized` | 자동 로그아웃, `onUnauthorized` 콜백 |
| 400 | `validation` | 오류 메시지 표시 |
| 404 | `notFound` | 빈 상태 |
| 5xx | `serverError` | 재시도 안내 |
| 네트워크 오류 | `network` | 오프라인 배너 |
| Google 계정 선택 취소 | — | 무시 (SignIn 버튼 복귀) |

---

## 관련 화면

- `SidebarWidget` — 사용자 카드 (로그인/로그아웃 UI)
