# Auth Service

`lib/auth/` 레이어 전체

---

## 역할

Google Sign-In을 통해 idToken을 획득하고 Fastify 백엔드와 교환하여 앱 세션을 생성합니다. 토큰을 안전하게 저장하고 세션을 복원합니다.

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
- `restoreSession()` → 저장된 토큰으로 세션 복원
- `signOut()` → Google + 로컬 토큰 삭제
- `isLoading`, `isAuthenticated`, `error` 공개

### AuthRepository

- 토큰 저장·삭제: `flutter_secure_storage`
- `googleLogin(idToken)` → `AuthApi.googleLogin()` → 토큰 저장 → 프리로드
- `_preloadUserData()` — 로그인 후 4개 엔드포인트 병렬 호출

### AuthApi

- `POST /v1/auth/google` → `AuthTokens` 반환

---

## 호출 대상 (Route)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/v1/auth/google` | idToken → access_token + refresh_token + user |
| GET | `/v1/users/me` | 로그인 후 프리로드 |
| GET | `/v1/settings/ai` | 로그인 후 프리로드 |
| GET | `/v1/settings/ui` | 로그인 후 프리로드 |
| GET | `/v1/apikey/status` | 로그인 후 프리로드 |

API 상세 명세: `./docs/api/` 참조

---

## Request / Response 요약

```jsonc
// POST /v1/auth/google
// Request
{ "id_token": "eyJh..." }

// Response (성공)
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": { "id": "uuid", "email": "...", "name": "...", "avatar_url": "..." }
  }
}
```

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
