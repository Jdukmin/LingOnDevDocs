# Product Definition

> **Status**: Adopted · **Last Updated**: 2026-07-21

이 문서는 LetMeKnow가 **무엇인지(What)**가 아니라 **왜(Why)** 존재하는지를
정의한다. 구현 방법(How)은 여기 적지 않는다 — 구현은 [backend/docs](../../backend/docs),
[frontend/docs](../../frontend/docs), 실행 대상 Requirement는 [requirements/](../../requirements/)를 본다.

---

## 현재 제품의 정의

**LetMeKnow는 Dashboard가 아니다.**
**LetMeKnow는 Personal Action OS이다.**

Dashboard는 눈에 가장 먼저 띄는 표면일 뿐, 제품의 본질이 아니다. 제품의 본질은
사용자의 의도를 실제 행동(Action)으로 옮기는 능력이다.

## Mission

```
App-Centric UX
      ↓
Intent-Centric UX
```

지금까지의 소프트웨어는 사용자가 앱을 골라 열고, 그 앱의 UI를 따라 조작해야
했다(App-Centric). LetMeKnow의 미션은 이 순서를 뒤집는 것이다: 사용자는 자신의
**의도(Intent)**만 표현하고, 그 의도를 어떤 앱/서비스로 실행할지는 시스템이
판단한다(Intent-Centric).

## Vision

사용자는 앱을 열지 않는다.
의도를 말한다.
AI가 실행한다.

## Core Philosophy

**Dashboard는 제품이 아니다. Action Layer가 제품이다.**

Dashboard는 Action Layer가 무엇을 하고 있는지를 시각화하는 인터페이스일 뿐이다.
Dashboard 자체를 아무리 잘 만들어도 Action Layer가 얇으면 제품은 성립하지 않는다.

> **모든 신규 기능은 Action Layer를 강화하는 방향이어야 한다.**

이 원칙은 기능 우선순위를 정할 때 가장 먼저 적용되는 필터다. 자세한 우선순위
규칙은 [../development_rules.md](../development_rules.md)를 따른다.

---

## 현재 구현과의 관계 (참고)

이 문서가 정의하는 "제품"과 현재 코드베이스의 실제 무게중심은 아직 다르다.
[requirements/system_requirements.md](../../requirements/system_requirements.md)의
근거 노트 기준으로:

- Dashboard(Layer 3 — SYS-001)는 위젯 대부분이 이미 구현되어 있다(Clock/Weather/Calendar/Chat/Brief/Status, 75% 수준 다수).
- Action Layer(SYS-006), Intent Layer(SYS-004), Planner Layer(SYS-009)는 아직 0%다 — 코드/문서 근거가 전혀 없다.

즉 지금까지의 개발 투자는 이 문서가 "제품이 아니다"라고 규정한 Layer(Dashboard)에
집중되어 있었고, 이 문서가 "제품이다"라고 규정한 Layer(Action)는 아직 시작되지
않았다. 이 문서 이후의 모든 기능 개발은 이 격차를 줄이는 방향으로 우선순위가
재조정되어야 한다. 관련 결정: [../decisions/architecture_decisions.md](../decisions/architecture_decisions.md).

## 관련 문서

- [positioning.md](positioning.md) — 시장 포지셔닝
- [architecture.md](architecture.md) — 제품 계층(Layer) 정의
- [competitors.md](competitors.md) — 경쟁사 분석
- [../roadmap/roadmap.md](../roadmap/roadmap.md) — 이 철학을 따르는 실행 순서
- [../../requirements/README.md](../../requirements/README.md) — Requirement 작성/추적 규칙(How가 시작되는 지점)
