# Competitive Analysis

> **Status**: Adopted · **Last Updated**: 2026-07-21

제품 포지셔닝은 [positioning.md](positioning.md)를 본다. 이 문서는 그 포지셔닝의
근거가 되는 경쟁 구도를 정리한다.

---

## 경쟁사 분석

| 경쟁사 | 강점 | 약점 |
|---|---|---|
| **DAKboard** | Dashboard | Action 없음 |
| **Home Assistant** | Automation | UX |
| **ChatGPT** | Language | Action 제한 |
| **Copilot** | Microsoft 생태계 | Multi-Service Action 부족 |

각 경쟁사는 파이프라인(Natural Language → Intent → Action → Visualization,
[positioning.md](positioning.md) 참조)의 **한 구간만** 강하다:

- DAKboard는 Visualization만 잘한다 (Action 자체가 없음).
- Home Assistant는 Action(Automation)은 강하지만 자연어/UX 진입장벽이 높다.
- ChatGPT는 Language 이해는 강하지만 실제 서비스 실행(Action) 범위가 제한적이다.
- Copilot은 Microsoft 생태계 안에서는 강하지만, 여러 외부 서비스를 넘나드는
  Multi-Service Action이 약하다.

## LetMeKnow 목표

```
Dashboard + AI Agent + IoT + Infrastructure = Personal Action OS
```

경쟁사 중 누구도 이 네 가지(Dashboard 시각화, AI Agent의 언어 이해, IoT 실행,
Infrastructure 통합)를 하나의 파이프라인으로 묶지 않는다. LetMeKnow의 차별점은
개별 구간의 완성도가 아니라 **파이프라인 전체를 하나로 잇는 것**이다.

## 관련 문서

- [positioning.md](positioning.md), [product.md](product.md)
- [../../requirements/connector_requirements.md](../../requirements/connector_requirements.md) — IoT/Infrastructure 커넥터 구현 현황
- [../../requirements/chat_requirements.md](../../requirements/chat_requirements.md) — AI Agent(자연어) 구현 현황
