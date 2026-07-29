# Notification Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Owner**: Platform/Delivery · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다. 현재 "예정 기능"으로만 언급된 Push 알림
([frontend/docs/FeatureList.md](../../frontend/docs/FeatureList.md))을 포함해,
Action/Reminder/Tool 등 다른 Domain의 산출물을 사용자에게 전달하는 통합
계약이 아직 없다 — 이 문서가 최초 정의다.

---

# Purpose

Notification은 "Action Domain이 만든 결과를 사용자가 실제로 인지하게 만드는"
계층이다. Action이 아무리 잘 실행되어도 사용자가 모르면 신뢰를 얻을 수 없다 —
특히 Workflow처럼 백그라운드에서 실행되는 다단계 작업일수록 Notification의
역할이 커진다.

# Domain Model

| Entity | 설명 |
|---|---|
| **Notification** | 사용자에게 전달할 단일 알림(제목, 본문, 출처 Domain/Event, 우선순위). |
| **NotificationChannel** | 전달 경로(Chat/Dashboard/Push/Voice/Email/Webhook). |
| **NotificationPreference** | 사용자가 설정한 채널별/도메인별 수신 여부. |

# Responsibilities

**한다**
- Action/Reminder/Tool 등 다른 Domain이 발행한 Event를 받아 사용자에게
  전달할 가치가 있는지 판단한다(모든 Event가 알림이 되는 것은 아니다).
- `NotificationPreference`에 따라 어떤 `NotificationChannel`로 보낼지 결정한다.
- 알림의 우선순위/긴급도를 정의한다.

**하지 않는다**
- Action을 실행하거나 재시도를 지시하지 않는다 — 오직 전달만 한다.
- 채널별 실제 전송 프로토콜(APNs/FCM/SMTP 등)을 정의하지 않는다 — 이는
  구현 수단이며 Tool Domain의 개별 어댑터로 다뤄질 수 있다.
- Dashboard를 직접 갱신하지 않는다 — Dashboard Domain은 자신의 채널로서
  Notification을 구독할 뿐, Notification이 Dashboard 상태를 조작하지 않는다.

# State

> **정정 2026-07-23 (DevDocs SSOT 정리)**: [action.md](action.md) 등이 정한
> 소문자 snake_case 표기로 통일한다(이전 버전은 PascalCase).

| State | 의미 |
|---|---|
| `pending` | 발행됨, 전달 대기 |
| `delivered` | 하나 이상의 채널로 전달됨 |
| `read` | 사용자가 확인함 |
| `suppressed` | `NotificationPreference`에 의해 전달이 억제됨 |

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `NotificationCreated` | 다른 Domain의 Event를 받아 알림으로 변환함 | (내부) |
| `NotificationDelivered` | 채널 전달 완료 | History |
| `NotificationSuppressed` | 사용자 설정으로 억제됨 | (내부 로깅) |
| `NotificationRead` | 사용자가 확인함 | History |

# Inputs

- `ExecutionCompleted` / `ExecutionFailed`(Action Domain)
- `ReminderTriggered`(Reminder Domain)
- `ToolConnectionExpired`(Tool Domain)
- `WorkflowCompleted` / `WorkflowRolledBack`(Workflow Domain)
- `IntentRejected`(Intent Domain)

# Outputs

- `Notification` 객체(전달된 채널 목록 포함)
- Dashboard가 구독 가능한 "최근 알림" 목록

# Relationships

```
Action / Reminder / Tool / Workflow → Notification → NotificationChannel(사용자)
```

- **Action Domain**: 가장 빈번한 발행원([action.md](action.md)).
- **Reminder Domain**: 시간 기반 발행원([reminder.md](reminder.md)).
- **Tool Domain**: 연결 만료 등 인프라성 알림 발행원([tool.md](tool.md)).
- **Dashboard Domain**: Notification을 하나의 표시 채널로 구독하지만,
  Dashboard 자신은 알림을 생성하지 않는다([dashboard.md](dashboard.md)).

# Future Extensions

- Push(모바일), Voice(음성 알림), Email, Webhook 채널 추가
  ([frontend/docs/FeatureList.md](../../frontend/docs/FeatureList.md) "푸시 알림" 예정 기능과 연결)
- 알림 다이제스트(여러 알림을 요약해 한 번에 전달)
- 사용자별/도메인별 세분화된 `NotificationPreference` UI

# References

- Backend: (구현 없음)
- Frontend: [frontend/docs/FeatureList.md](../../frontend/docs/FeatureList.md) (예정 기능: 푸시 알림)
- Strategy: [docs/roadmap/roadmap.md](../../docs/roadmap/roadmap.md), [docs/icd/action_layer_api.md](../../docs/icd/action_layer_api.md) (Event 모델)
- Requirement: 아직 없음 — 착수 시 신규 Requirement 문서 필요
