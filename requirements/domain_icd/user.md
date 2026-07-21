# User Domain

> **Status**: Proposed · **Progress**: 75% · **Last Updated**: 2026-07-21 · **Owner**: Platform/Identity · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다. Google OAuth/JWT 구현 세부사항은
[backend/docs/api/auth.md](../../backend/docs/api/auth.md)에 있다 — 이
문서는 "사용자"라는 비즈니스 개념(신원, 권한, 소유권)을 정의한다.

**Progress 근거**: 이 Domain 안에서 가장 잘 갖춰진 부분은 인증/세션이다
(로그인/로그아웃/토큰 회전이 FE·BE 양쪽에서 완성 — [requirements/system_requirements.md](../system_requirements.md) SYS-008,
75%). 다만 "Tool 연결 권한 관리", "Action 소유권" 같은 이 Domain의 나머지
책임은 개별 기능(Google Calendar 연결 등)에 흩어져 있을 뿐, User Domain
계약으로 통합되어 있지 않다 — 통합 자체는 0%다. 종합 75%로 평가한 이유는
이미 완성된 인증/세션이 이 Domain의 가장 크고 위험이 높은 부분이기 때문이다.

---

# Purpose

User Domain은 "누가 요청했는가", "이 사용자가 이 Action/Tool을 쓸 권한이
있는가"를 답한다. Action, Tool, Reminder, Workflow 등 거의 모든 다른
Domain이 "특정 User에 귀속된 무언가"를 다루므로, User Domain은 이 전체
계약 체계의 기반이다.

# Domain Model

| Entity | 설명 |
|---|---|
| **User** | LetMeKnow 사용자 계정(신원, 표시 이름, 프로필). |
| **Session** | 로그인된 상태의 사용자 활동 단위(액세스/리프레시 토큰 생명주기로 표현되지만, 이 Domain에서는 개념만 다룸). |
| **Permission** | 특정 Tool/Action Type에 대해 사용자가 부여한 권한(Intent Domain의 `RequiredPermission`이 참조하는 대상). |
| **Preference** | 사용자별 설정(AI 설정, UI 설정 등 — 기존 `ai_settings`/`ui_settings`의 비즈니스 개념). |

# Responsibilities

**한다**
- 사용자 신원을 정의하고, 어떤 Provider(Google 등)로 인증되었는지를 추상화한다.
- `Session`의 유효성(로그인 상태) 개념을 정의한다.
- `Permission`(어떤 Tool/Action Type을 이 사용자가 쓸 수 있는지)을 관리한다 —
  Intent Domain의 Validation과 Action Domain의 Action Selection이 이를 조회한다.
- `Preference`를 저장/제공한다(AI 모델 선택, UI 테마 등).

**하지 않는다**
- OAuth/JWT의 구체적 프로토콜을 정의하지 않는다 — Tool Domain(또는 인증
  전용 어댑터)의 구현 수단이다.
- Action을 실행하지 않는다.
- Tool과 직접 통신하지 않는다 — `Permission` 여부만 답할 뿐, 실제 Tool
  연결/호출은 Tool Domain의 책임이다.

# State

| State | 의미 |
|---|---|
| `Anonymous` | 로그인하지 않음(게스트) |
| `Authenticated` | 로그인됨, `Session` 유효 |
| `SessionExpired` | `Session` 만료, 재인증 필요 |
| `Suspended` | (향후) 관리 목적의 계정 정지 |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `UserAuthenticated` | 로그인 성공 | Dashboard(개인화된 데이터 로드), Action Domain |
| `SessionExpired` | 토큰 만료/무효화 | Notification Domain(재로그인 유도), Action Domain(진행 중 Action 처리 정책) |
| `PermissionGranted` / `PermissionRevoked` | Tool 연결/해제 등으로 권한 변경 | Intent Domain(Validation 갱신), Action Domain |
| `PreferenceUpdated` | 설정 변경 | (구독하는 모든 Domain) |

# Inputs

- 인증 Provider(Google 등)로부터의 신원 확인 결과
- 사용자의 설정 변경 요청
- Tool Domain으로부터의 `ToolConnected`/`ToolConnectionExpired` 이벤트(Permission 갱신용)

# Outputs

- `User` 식별자(모든 다른 Domain이 참조하는 소유권 키)
- `Permission` 조회 결과(Intent/Action Domain이 참조)
- `Preference` 값

# Relationships

```
User ← (모든 Domain이 참조)
```

User Domain은 Dashboard Domain과 함께 이 Domain ICD에서 **가장 많이
참조되는 쪽**이다 — Action, Tool, Reminder, Workflow, Calendar 전부가
"어떤 User의 것인가"를 User Domain에 의존해 판단한다.

- **Intent Domain**: `RequiredPermission` 판단 시 User의 `Permission`을 조회([intent.md](intent.md)).
- **Action Domain**: 모든 Execution은 User에 귀속([action.md](action.md)).
- **Tool Domain**: `ToolConnection`은 User별로 존재([tool.md](tool.md)).

# Future Extensions

- 다중 사용자/가구 단위 공유 컨텍스트(예: 가족 캘린더)
- 세분화된 역할 기반 권한(Role-based Permission)
- 계정 삭제/데이터 이동성(GDPR류 요구사항)

# References

- Backend: [backend/docs/api/auth.md](../../backend/docs/api/auth.md), [backend/docs/api/users.md](../../backend/docs/api/users.md), [backend/docs/database/users.md](../../backend/docs/database/users.md)
- Frontend: [frontend/docs/services/AuthService.md](../../frontend/docs/services/AuthService.md)
- Strategy: [docs/strategy/architecture.md](../../docs/strategy/architecture.md)
- Requirement: [requirements/system_requirements.md](../system_requirements.md) SYS-008, [requirements/connector_requirements.md](../connector_requirements.md) CON-006(OAuth Management)
