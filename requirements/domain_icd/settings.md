# Settings Domain

> **Status**: Proposed · **Progress**: 50% · **Last Updated**: 2026-07-22 · **Owner**: Platform/Identity · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다 — REST 세부사항은
[backend/docs/api/settings.md](../../backend/docs/api/settings.md)에 있다.

**신규 작성 배경**: [user.md](user.md)가 `Preference` Entity로 뭉뚱그려
다루던 개념(AI 설정, UI 설정)을 독립 Domain으로 분리한다 — Settings는
User의 신원/권한과는 성격이 다른(단순 값 저장/조회) 책임이라 별도 계약이
관리하기 쉽다.

**Progress 근거**: Backend `GET`/`PUT /v1/settings/ai`, `/ui`가 완전히
구현되어 있고([requirements/system_requirements.md](../system_requirements.md)),
Frontend는 로그인 후 프리로드 단계에서 두 설정을 모두 읽어온다
([frontend/docs/services/AuthService.md](../../frontend/docs/services/AuthService.md)
"로그인 후 프리로드"). 다만 UI에서 실제로 값을 변경해 저장하는 화면·
연동까지 확인된 근거는 부족해 50%로 평가한다.

---

# Purpose

Settings Domain은 "사용자가 조정 가능한 값"이라는 비즈니스 개념을 정의한다.
AI 응답 방식(모델, 온도)과 화면 표시 방식(테마, 언어)은 서로 다른 팀/화면이
소유하지만, "사용자별로 저장되고 언제든 조회 가능하다"는 공통 계약을
가진다 — 이 계약이 없으면 새 설정 항목을 추가할 때마다 저장/조회 방식을
다시 설계해야 한다.

# Domain Model

| Entity | 설명 |
|---|---|
| **AISettings** | AI 응답 방식 설정(`model`, `temperature`, `max_tokens`, `system_prompt`). |
| **UISettings** | 화면 표시 설정(`theme`, `language`). |

# Responsibilities

**한다**
- `AISettings`/`UISettings`의 정규 스키마를 정의한다.
- 값 범위/허용값을 정의한다 — 예: `temperature`는 0~2, `theme`은
  `system`/`light`/`dark` 중 하나(API Contract Verification에서 Backend가
  `theme`/`language`에 enum 제약을 걸지 않고 있다는 점이 지적됐다 — 이
  Domain의 계약이 그 허용값의 **단일 기준**이 되어야 한다).
- 전체 교체(upsert) 방식임을 명시한다 — 부분 수정(PATCH 의미)은 지원하지
  않는다(`backend/docs/api/settings.md`와 동일).

**하지 않는다**
- API 키(BYOK, `user_api_keys`)를 다루지 않는다 — 그것은 LLM Gateway/Tool
  Domain의 자격증명이지 "설정 값"이 아니다([tool.md](tool.md), [llm_gateway_requirements.md](../llm_gateway_requirements.md)).
- UI를 그리지 않는다 — Dashboard/SidebarWidget의 책임이다.
- 값 변경에 따른 부수효과(테마 즉시 반영 등)를 정의하지 않는다 — 그것은
  Frontend 구현(State 반영)의 책임이다.

# State

무상태(Stateless) — 항상 최신 저장값을 반환한다. 별도 State 머신 없음.
`AISettings`/`UISettings`가 아직 설정되지 않은 사용자는 `null`을 반환한다
(`backend/docs/api/settings.md`와 동일한 계약).

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `AISettingsUpdated` | AI 설정 저장 | (해당 값을 참조하는 모든 Domain — 예: 향후 LLM Gateway) |
| `UISettingsUpdated` | UI 설정 저장 | Dashboard(테마/언어 반영) |

# Inputs

- Action Domain의 `settings.get_ai` / `settings.save_ai` / `settings.get_ui` / `settings.save_ui` 실행 요청(또는 Action Layer 도입 전까지는 API ICD를 통한 직접 호출)

# Outputs

- `AISettings | null`, `UISettings | null`

# Relationships

```
User → Settings Domain
```

- **User Domain**: Settings는 항상 특정 User에 귀속된다 — User Domain의
  `Preference` 개념은 이 Domain으로 위임한다([user.md](user.md)).
- **Dashboard Domain**: `UISettings.theme`을 `SidebarWidget`/전체 테마가 구독한다.
- **Tool Domain**: `AISettings`는 향후 LLM Gateway(Tool의 한 사례)가 참조할
  파라미터를 제공한다 — Settings 자체가 LLM을 호출하지는 않는다.

# Future Extensions

- 설정 항목 확장 시(예: 알림 채널 선호도) 이 Domain에 Entity 추가
- 설정 변경 이력(감사 로그)
- 기기별 설정 분리(현재는 사용자 단위 단일 설정)

# References

- Backend: [backend/docs/api/settings.md](../../backend/docs/api/settings.md), [backend/docs/database/ai_settings.md](../../backend/docs/database/ai_settings.md), [backend/docs/database/ui_settings.md](../../backend/docs/database/ui_settings.md)
- Frontend: [frontend/docs/services/AuthService.md](../../frontend/docs/services/AuthService.md)(프리로드), [frontend/docs/widgets/SidebarWidget.md](../../frontend/docs/widgets/SidebarWidget.md)(테마 토글)
- Strategy: —
- Requirement: [requirements/system_requirements.md](../system_requirements.md)
