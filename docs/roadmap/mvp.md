# MVP Priority

> **Status**: In Progress · **Last Updated**: 2026-07-21

전체 시간축 계획은 [roadmap.md](roadmap.md)를 본다. 이 문서는 "지금 당장 무엇부터"에
대한 Tier 우선순위만 다룬다.

**Dashboard는 MVP가 아니다. Action Layer가 MVP이다.**
([../strategy/product.md](../strategy/product.md) Core Philosophy 참조)

---

| Tier | 내용 | Status | Progress | Last Updated | Next Milestone |
|---|---|---|---|---|---|
| Tier 0 | Natural Language → Action | Planned | 0% | 2026-07-21 | Intent Classification 최초 설계([requirements/intent_requirements.md](../../requirements/intent_requirements.md) INT-001) |
| Tier 1 | Calendar, Todo, Reminder | In Progress | 25% | 2026-07-21 | Tier 0 없이는 "자연어로 실행"이 불가능 — Tier 0과 병행 필요 |
| Tier 2 | Home Assistant | Planned | 0% | 2026-07-21 | [requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-002 설계 |
| Tier 3 | NAS, Server Monitoring | Planned | 0% | 2026-07-21 | CON-004/CON-005 설계 |
| Tier 4 | Workflow, Multi Action | Planned | 0% | 2026-07-21 | [requirements/planner_requirements.md](../../requirements/planner_requirements.md) PLN-001 설계 |
| Tier 5 | Always-On Dashboard | In Progress | 25% | 2026-07-21 | 신규 투자 보류, 유지보수만 |

## 왜 Tier 0이 가장 중요한가

Tier 1~4는 전부 "무엇을 실행할 것인가(도메인)"에 대한 목록이고, Tier 0은
"어떻게 실행 요청을 이해할 것인가"다. Tier 0(Intent → Action 파이프라인) 없이
Tier 1~4를 아무리 채워도, 사용자는 여전히 화면을 눌러야 한다 — 그러면
DAKboard/Home Assistant와 다를 것이 없다([../strategy/competitors.md](../strategy/competitors.md)).
그래서 Tier 0은 Tier 1보다 먼저, 최소한 병행해서 진행되어야 한다.

## Tier 5(Dashboard)가 MVP가 아닌 이유

Tier 5는 이미 Progress가 가장 높다(25%, 개별 위젯 기준으로는 75%). 하지만
PMF 검증([kpi.md](kpi.md))에 필요한 것은 "화면이 예쁜가"가 아니라 "사용자가
명령을 내리는가"이므로, 이미 구현된 Dashboard에 대한 **추가 투자**는 MVP
우선순위에서 제외한다.

## 관련 문서

- [roadmap.md](roadmap.md), [kpi.md](kpi.md)
- [../decisions/architecture_decisions.md](../decisions/architecture_decisions.md) — 이 우선순위의 결정 근거
- [../../requirements/README.md](../../requirements/README.md)
