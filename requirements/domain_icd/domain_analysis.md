# Domain Analysis — Gaps, Overlaps, Priority

> **Status**: Complete (분석 완료, Weather/Todo/Settings는 2026-07-22에 실제 작성됨) · **Progress**: N/A(분석 문서) · **Last Updated**: 2026-07-22 · **Owner**: Product/Architecture · **Version**: 0.2.0-draft

[README.md](README.md)의 Domain을 현재 `backend/docs`(API), `frontend/docs`(Service/State),
`backend/docs/database`(DB)와 비교해 분석한다. 이하 "제안"이라고 표시한
것 중 **Weather/Todo/Settings는 2026-07-22에 실제로 문서가 작성되어 더 이상
제안 상태가 아니다**([weather.md](weather.md), [todo.md](todo.md), [settings.md](settings.md)) —
나머지(Memory/Context 등)는 여전히 작성하지 않은 제안이다.

---

## 1. 누락됐던 Domain — 2026-07-22 작성 완료

| Domain | 근거 | 상태 |
|---|---|---|
| **Weather** | 백엔드 `GET /v1/weather/*`(4개 엔드포인트, 완성), 프론트 `WeatherNowWidget`/`WeatherForecastWidget` — [backend/docs/api/weather.md](../../backend/docs/api/weather.md) | ✅ [weather.md](weather.md) 작성 완료 |
| **Todo** | [requirements/dashboard_requirements.md](../dashboard_requirements.md) DSH-004, [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) Tier 1("Calendar, Todo, Reminder") | ✅ [todo.md](todo.md) 작성 완료 |
| **Settings**(신규 지적) | User Domain의 `Preference`가 AI/UI 설정을 뭉뚱그려 다루고 있었음 | ✅ [settings.md](settings.md) 작성 완료(User Domain에서 분리) |

## 2. 여전히 미작성인 제안

| 제안 Domain | 근거 | 왜 필요한가 |
|---|---|---|
| **Memory/Context (RAG)** | [requirements/memory_requirements.md](../memory_requirements.md), [docs/strategy/architecture.md](../../docs/strategy/architecture.md) Layer 2(AI Decision) | Intent Domain의 Confidence 판단, Action Domain의 추천(Suggestion)이 결국 과거 맥락(캘린더 이력, 반복 패턴)에 의존하게 될 것이다. 지금은 근거가 전혀 없어(0%) 우선순위는 낮지만, Layer 2가 의미를 가지려면 결국 필요하다. |

## 3. 검토했지만 신규 Domain으로 제안하지 않는 것

| 후보 | 결론 | 이유 |
|---|---|---|
| **LLM / AI Gateway** | Tool Domain으로 흡수 | 별도 Domain이 아니라 Tool Domain의 한 구현 사례(`llm.chat_complete` 등)로 다루는 것이 일관적이다 — [tool.md](tool.md) Future Extensions, [requirements/llm_gateway_requirements.md](../llm_gateway_requirements.md) 참고. LLM Provider도 "외부 시스템에 대한 어댑터"라는 Tool의 정의를 그대로 만족한다. |
| **Server Monitoring**(NAS와 별개) | NAS Domain의 확장으로 처리 | [nas.md](nas.md)의 Domain Model(CPU/Memory/Storage/Health/Service)이 이미 NAS 전용이 아닌 일반 서버 지표다. 별도 Domain을 만들면 NAS와 90% 중복되므로, 지금은 NAS Domain의 Future Extensions로만 남긴다. 실제 구현에서 대상이 크게 갈라지면(예: 다수의 이기종 서버 관리) 그때 분리를 재검토한다. |
| **Notion / Knowledge** | 제안 보류 | `connector_requirements.md` CON-003이 0%이고 구체적 사용 시나리오가 아직 없다. Todo/Reminder/Calendar가 먼저 자리잡은 후, 필요성이 확인되면 별도 Domain으로 정의한다. |
| **Chat(대화 UI)** | Domain 아님(의도적 제외) | Chat은 비즈니스 개념이 아니라 Intent Domain의 입력 채널(Frontend UI)이다 — [intent.md](intent.md) Inputs, [dashboard.md](dashboard.md) 참고. 별도 Domain 계약을 만들면 Intent와 경계가 모호해진다. |
| **History / Execution** | 별도 Domain 아님(Action Domain 하위 개념) | 사용자가 요청한 11개 문서 목록에 없었고, Action Lifecycle의 일부이므로 [action.md](action.md) 안에 Entity로 정의했다 — [README.md](README.md) "핵심 실행 모델"의 주의 사항 참고. 향후 History가 자체적으로 복잡해지면(예: 분석/내보내기 기능) 그때 분리한다. |

## 4. 중복 Domain

없음. 11개 Domain 간 겹치는 책임은 발견되지 않았다 — 경계가 모호해 보일 수
있는 두 쌍은 각 문서의 "하지 않는다" 절에서 명시적으로 분리했다:

- **Notification vs Dashboard**: Notification은 능동적 전달(push성), Dashboard는
  수동적 구독(pull성) — [dashboard.md](dashboard.md) Relationships.
- **Reminder vs Calendar**: Reminder는 LetMeKnow 자체 소유의 시간 트리거,
  Calendar는 외부 캘린더 동기화 — [reminder.md](reminder.md) Relationships.

## 5. 불필요한 Domain

없음. 요청받은 11개 Domain 전부 현재 전략([docs/strategy/product.md](../../docs/strategy/product.md))과
로드맵([docs/roadmap/roadmap.md](../../docs/roadmap/roadmap.md))에서 근거를 찾을 수 있었다.

---

## 6. 구현 우선순위 — MVP / Phase 2 / Phase 3

[docs/roadmap/mvp.md](../../docs/roadmap/mvp.md)의 Tier 체계를 3단계로 압축했다.
"우선순위"는 **신규 투자 우선순위**를 뜻하며, Dashboard처럼 이미 구현된
Domain은 예외적으로 각주에 설명을 붙였다.

| 우선순위 | Domain | 근거 |
|---|---|---|
| **MVP** | Intent | Tier 0 — Action 파이프라인의 시작점 |
| **MVP** | Action | Tier 0 — 제품의 본질 |
| **MVP** | Tool | Tier 0~1 — 실행 없이는 아무것도 안 됨. 이미 25%(BaseGateway 패턴) |
| **MVP** | User | 이미 75% 구현(인증/세션) — Permission 계약만 정식화하면 됨 |
| **MVP** | Calendar | Tier 1. 이미 25%(백엔드 완료) |
| **MVP** | Reminder | Tier 1. 0%지만 로드맵상 최우선 |
| **MVP** | Todo | Tier 1. 0%, Reminder와 함께 착수([todo.md](todo.md) 작성 완료) |
| **MVP** | Weather | 이미 75% 구현 — 계약 정식화 비용이 거의 없음([weather.md](weather.md) 작성 완료) |
| **MVP** | Settings | 이미 50% 구현, User/Dashboard 등 다른 MVP Domain이 참조([settings.md](settings.md) 작성 완료) |
| **Phase 2** | Notification | Tier 2 이후 — 백그라운드/비동기 Action이 늘어날 때 가치가 커짐 |
| **Phase 2** | HomeAssistant | Tier 2 |
| **Phase 3** | Workflow | Tier 4 — 여러 Tool이 갖춰진 뒤에야 의미 있음 |
| **Phase 3** | NAS | Tier 3 |
| **Phase 3**\* | Dashboard | Tier 5(신규 투자 기준). \*단, 이 Domain의 **계약(경계) 자체는 지금 당장 적용**되어야 한다 — 이미 대부분 구현된 코드가 계속 커지고 있어, 계약을 늦게 정의할수록 Business Logic이 스며들 위험이 커진다. |
| **Phase 3**(제안) | Memory/Context | Layer 2(AI Decision) 전제조건, 현재 0% |

### 왜 User와 Tool이 이미 25~75%인데도 MVP인가

Progress가 높다고 우선순위가 낮아지는 것이 아니다 — 오히려 User/Tool은
**다른 모든 MVP Domain이 의존하는 기반**이라 가장 먼저 계약으로 확정되어야
한다. Dashboard가 예외적으로 Phase 3인 이유는 반대다: 이미 구현되어 있지만
다른 Domain이 Dashboard에 의존하지 않는다(오히려 Dashboard가 전부를
구독) — 그래서 신규 투자를 늦춰도 다른 Domain 개발을 막지 않는다.

## 관련 문서

- [README.md](README.md) — Domain 목록/핵심 실행 모델
- [../../docs/roadmap/mvp.md](../../docs/roadmap/mvp.md), [../../docs/roadmap/roadmap.md](../../docs/roadmap/roadmap.md)
- [../../docs/icd/gap_analysis.md](../../docs/icd/gap_analysis.md) — API/Event/State 레벨 갭 분석(이 문서는 Domain 레벨)

---

# Change Log

- **2026-07-21** — Personal Action OS 전략에 따라 최초 작성.
