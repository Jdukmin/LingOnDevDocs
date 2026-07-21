# Positioning

> **Status**: Adopted · **Last Updated**: 2026-07-21

제품 정의는 [product.md](product.md)를 본다. 이 문서는 LetMeKnow를 시장/경쟁
구도 안에서 어떻게 규정할지를 다룬다.

---

## 현재 포지션

**Personal Action OS**

**NOT**
- Dashboard
- AI Chat
- Smart Home App

**BUT**

```
Natural Language
      ↓
    Intent
      ↓
    Action
      ↓
 Visualization
```

LetMeKnow는 "예쁜 대시보드"도, "또 하나의 챗봇"도, "스마트홈 컨트롤러"도 아니다.
이들은 전부 이 파이프라인의 부분(마지막 단계인 Visualization, 혹은 특정 도메인
하나)에 불과하다. LetMeKnow의 정체성은 자연어 → Intent → Action → Visualization
전체 파이프라인을 소유한다는 데 있다.

## 장기 목표

**AI Operating Layer**

Productivity, Infrastructure, IoT, Personal AI를 하나의 실행 플랫폼으로 통합한다.

| 영역 | 예시 |
|---|---|
| Productivity | Calendar, Todo, Reminder |
| Infrastructure | NAS, Server Monitoring |
| IoT | Home Assistant, Matter, MQTT |
| Personal AI | Chat, Briefing, 추천 |

이 네 영역은 서로 다른 앱으로 흩어져 있는 것이 현재 시장의 기본값이다.
LetMeKnow의 장기 목표는 이 네 영역에 대한 **단일 실행 계층(하나의 Action Layer)**이
되는 것이다 — 각 영역의 커넥터는 [connector_requirements.md](../../requirements/connector_requirements.md)에서
추적한다.

## 관련 문서

- [product.md](product.md) — Mission/Vision/Core Philosophy
- [architecture.md](architecture.md) — 이 포지셔닝을 구현하는 4-Layer 구조
- [competitors.md](competitors.md) — 경쟁사 대비 격차
- [../../requirements/connector_requirements.md](../../requirements/connector_requirements.md) — 영역별 커넥터 구현 현황
