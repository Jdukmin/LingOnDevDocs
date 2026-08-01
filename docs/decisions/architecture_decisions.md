# Architecture Decisions

전략적으로 중요한 설계 결정을 날짜와 함께 기록한다. 새 결정은 표 아래에
**추가만** 한다 — 기존 결정은 삭제하지 않고, 상태가 바뀌면 Status를
`Superseded`로 바꾸고 대체 결정을 링크한다.

"Progress"는 이 결정이 **실제 개발 우선순위에 얼마나 반영되었는지**를 뜻한다
(결정 자체의 완료율이 아니다) — 근거는 [requirements/](../../requirements/)의
Status/Progress를 인용한다.

---

| ID | Date | Decision | Reason | Status | Progress | Next Milestone |
|---|---|---|---|---|---|---|
| DEC-001 | 2026-07-21 | Dashboard는 MVP가 아니다 | 차별성이 없다 — DAKboard 등 순수 Dashboard 제품과 구분되지 않는다([../strategy/competitors.md](../strategy/competitors.md)) | Adopted | 0% | 신규 기능 제안 시 Dashboard 관련 항목을 후순위로 배치하는지 검토([../development_rules.md](../development_rules.md) 규칙 9) |
| DEC-002 | 2026-07-21 | Action Layer가 MVP이다 | PMF를 가장 빠르게 검증할 수 있다 — [../roadmap/kpi.md](../roadmap/kpi.md)의 Primary KPI(Daily Action Count)를 만들 수 있는 유일한 계층 | Adopted | 0% | Tier 0(Natural Language → Action) 착수 — [../../requirements/intent_requirements.md](../../requirements/intent_requirements.md) INT-001 |
| DEC-003 | 2026-07-21 | Integrations가 UI보다 우선이다 | Priority: Calendar → Todo → Reminder → Home Assistant → NAS → Workflow → Dashboard | Adopted | 25% | Reminder Requirement 정의, Todo(DSH-004) 착수 — [../roadmap/roadmap.md](../roadmap/roadmap.md) Phase 1 |
| DEC-004 | 2026-08-01 | LLM은 Tool Domain에 편입하지 않고 **별도 Domain**으로 둔다 | Tool의 `ToolConnection` 5-state(OAuth 수명주기)가 LLM에 적용되지 않고, Intent/Planner가 Action을 거치지 않고 LLM을 직접 소비하며, Provider 라우팅·폴백·비용·구조화 출력이 범용 Tool 계약보다 풍부하다 — [../../requirements/domain_icd/llm.md](../../requirements/domain_icd/llm.md) §Relationships | Adopted | 0% | Backend LLM Gateway 착수 — [../../requirements/llm_gateway_requirements.md](../../requirements/llm_gateway_requirements.md) LLM-006/007 |

---

## 근거 노트

- **DEC-001 / DEC-002**: [requirements/system_requirements.md](../../requirements/system_requirements.md)
  기준 SYS-001(Dashboard)은 25%(개별 위젯은 다수 75%)로 가장 진도가 빠르고,
  SYS-004(Intent)·SYS-006(Action)은 0%다. 즉 지금까지의 실제 개발은 이
  두 결정과 반대 방향으로 진행되어 왔다 — 그래서 Progress를 0%(결정이 아직
  실행에 반영되지 않음)로 정직하게 표기했다. 이 결정 이후의 기능 개발부터
  반영 여부를 추적한다.
- **DEC-003**: Calendar는 백엔드 Google Calendar 연동이 부분적으로 존재하므로([requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-001)
  Priority 리스트의 첫 항목에 한해 약간의 진행이 있어 25%로 표기. 나머지
  항목(Todo/Reminder/Home Assistant/NAS/Workflow)은 0%.
- **DEC-004**: [tool.md](../../requirements/domain_icd/tool.md) Future Extensions에
  "LLM Provider도 Tool의 한 사례로 편입할지 검토"로 미결 상태였던 항목의 결론이다.
  두 Domain은 **형제 관계**이며 상하 관계가 아니다. **이 결정은 DEC-001/002를
  바꾸지 않는다** — LLM은 여전히 Product Domain이 아니라 Engine/Tool 계층이고,
  제품 인터페이스는 Action Layer다. `User → LLM → Dashboard` 구조는
  [llm.md](../../requirements/domain_icd/llm.md) 상단에 명시적 금지로 기록했다.
  Progress 0%인 이유: 백엔드에 LLM Gateway가 존재하지 않는다(어댑터·라우트·SDK
  전무) — 근거는 [../ai_platform/2026-08-01-ai-platform-review.md](../ai_platform/2026-08-01-ai-platform-review.md) §3.
  "일단 별도 Domain으로 진행"(CTO, 2026-08-01)이므로, 향후 Tool 편입이
  타당해지면 이 행의 Status를 `Superseded`로 바꾸고 대체 결정을 링크한다.

## 결정 추가 방법

새 결정은 위 표에 새 행(`DEC-004`, ...)으로 추가하고, 이 섹션에 근거를
덧붙인다. 결정이 뒤집히면 해당 행의 Status를 `Superseded`로 바꾸고, 대체
결정 ID를 Reason 열 끝에 `(supersedes DEC-XXX)`로 표기한다.

## 관련 문서

- [../strategy/product.md](../strategy/product.md), [../strategy/architecture.md](../strategy/architecture.md)
- [../roadmap/roadmap.md](../roadmap/roadmap.md), [../roadmap/mvp.md](../roadmap/mvp.md)
- [../development_rules.md](../development_rules.md)
