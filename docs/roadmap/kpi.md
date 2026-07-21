# KPI

> **Status**: Planned (계측 미구현) · **Last Updated**: 2026-07-21

PMF 판단 기준: **사용자가 앱 대신 LetMeKnow에게 명령을 내리는가.**
이 판단을 수치화하기 위한 지표 목록이다. "Progress"는 이 지표를 실제로
측정할 수 있는 계측 파이프라인이 얼마나 구축되었는지를 뜻한다 — 목표 수치
달성률이 아니다.

---

| KPI | 구분 | Status | Progress | Last Updated | Next Milestone |
|---|---|---|---|---|---|
| Daily Action Count | Primary | Planned | 0% | 2026-07-21 | Action 실행 로그 스키마 정의 — [requirements/action_requirements.md](../../requirements/action_requirements.md) ACT-004 확장 |
| DAU | Secondary | Planned | 0% | 2026-07-21 | 세션/사용자 단위 집계 파이프라인 정의 |
| Retention | Secondary | Planned | 0% | 2026-07-21 | 코호트 기준(D1/D7/D30) 정의 |
| Average Actions/User | Secondary | Planned | 0% | 2026-07-21 | Daily Action Count 계측 이후 파생 지표로 산출 |
| Workflow Count | Secondary | Planned | 0% | 2026-07-21 | Workflow 개념 자체가 아직 없음 — [requirements/planner_requirements.md](../../requirements/planner_requirements.md) 선행 필요 |

## 근거

현재 유일한 사용량 계측 지점은 프론트엔드 `AnalyticsModule`(카운터)이며, 이는
Daily Action Count를 산출할 수 있는 스키마가 아니다. 근거:
[frontend/docs/state/Overview.md](../../frontend/docs/state/Overview.md).
백엔드는 `request_logs`/`raw_logs`(HTTP 요청/서버 예외 로그, [requirements/action_requirements.md](../../requirements/action_requirements.md) ACT-004)만
있고, "Action 실행"을 도메인 이벤트로 집계하는 테이블/파이프라인은 없다.
Primary KPI(Daily Action Count)를 실제로 측정하려면 Action Layer(Tier 0, [mvp.md](mvp.md))
구현과 함께 이 이벤트를 로깅하는 지점을 새로 만들어야 한다.

## Primary KPI가 Daily Action Count인 이유

수익 지표(매출, 결제 전환 등)를 넣지 않은 이유는 [roadmap.md](roadmap.md)의
"수익보다 PMF가 우선이다" 원칙 때문이다. 매출은 PMF 이후에 최적화할 대상이지,
지금 단계에서 성공/실패를 가르는 기준이 아니다.

## 관련 문서

- [roadmap.md](roadmap.md), [mvp.md](mvp.md)
- [../../requirements/action_requirements.md](../../requirements/action_requirements.md)
