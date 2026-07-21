# Development Rules

Claude가 반드시 따라야 하는 개발 규칙이다. 이 문서는 **왜/무엇을 먼저 할지**를
정한다(제품 우선순위). Requirement를 어떻게 작성·갱신하는지(**How의 절차**)는
[../requirements/README.md](../requirements/README.md)를 따른다 — 두 문서는
서로 대체하지 않고 함께 적용된다:

```
docs/development_rules.md   → 이 기능을 "왜/언제" 할지 (제품 우선순위)
requirements/README.md      → Requirement를 "어떻게" 쓰고 추적할지 (RDD 절차)
```

---

1. 새로운 기능을 만들기 전에 반드시 **Action Layer를 강화하는 기능인지** 검토한다.
   ([strategy/product.md](strategy/product.md) Core Philosophy)

2. **UI보다 기능을 우선한다.**

3. **Dashboard는 Action Layer 이후 개발한다.**
   (이미 구현된 Dashboard 기능을 되돌리라는 뜻이 아니라, **신규 투자**를
   Dashboard보다 Action Layer에 먼저 배정한다는 뜻이다 —
   [decisions/architecture_decisions.md](decisions/architecture_decisions.md) DEC-001/DEC-003)

4. 모든 구현은 **Product Market Fit 검증**에 도움이 되어야 한다.
   ([roadmap/roadmap.md](roadmap/roadmap.md) "수익보다 PMF가 우선이다")

5. 모든 Task에는 **status / progress / dependencies / next step**를 기록한다.
   (Requirement 단위 기록 형식은 [../requirements/README.md](../requirements/README.md)의
   Requirement Table을 따른다.)

6. 기능 완료 시 **관련 docs도 자동 업데이트**한다.
   (`frontend/docs`/`backend/docs`의 구현 문서, `requirements/`의 Status/Progress,
   그리고 이 전략 문서가 참조하는 근거 문장까지 포함한다.)

7. **Roadmap 진행률도 함께 업데이트**한다.
   ([roadmap/roadmap.md](roadmap/roadmap.md), [roadmap/mvp.md](roadmap/mvp.md)의 Progress/Last Updated/Next Milestone)

8. 새로운 기능 제안 시 다음 항목을 평가한다:
   - PMF 영향도
   - Daily Action Count 영향도 ([roadmap/kpi.md](roadmap/kpi.md))
   - 유지율(Retention) 영향도
   - 구현 난이도
   - 우선순위

9. 우선순위는 항상 다음 순서로 유지한다:

   ```
   Action Layer → AI Decision → Integrations → Dashboard → UI Polish
   ```

   ([strategy/architecture.md](strategy/architecture.md) Layer 우선순위,
   [decisions/architecture_decisions.md](decisions/architecture_decisions.md) DEC-003)

10. 제품 철학을 항상 유지한다.

    > "Dashboard가 제품이 아니다. Action Layer가 제품이다."

---

## 이 규칙과 Requirement 작성 규칙의 관계

기능 구현 요청을 받으면:

1. 이 문서의 1~4, 8~10번 규칙으로 **할 가치가 있는 기능인지** 먼저 판단한다.
2. [../requirements/README.md](../requirements/README.md)의 RDD 절차대로 **Requirement가
   있는지 확인 → 없으면 먼저 추가**한다.
3. 구현 후에는 Status/Progress를 추측하지 않고, 실제 프로젝트를 분석해 확인한
   뒤 갱신한다(`requirements/`, 이 문서가 가리키는 roadmap/decisions 포함).
4. 작업 종료 시 항상 보고한다: 수정된 Requirement, 변경된 Status, 변경된
   Progress, 변경 근거, Traceability 수정 여부, 새롭게 추가된 Requirement
   ([../requirements/README.md](../requirements/README.md) "작업 종료 시 보고" 참조).

## 관련 문서

- [strategy/product.md](strategy/product.md), [strategy/architecture.md](strategy/architecture.md)
- [roadmap/roadmap.md](roadmap/roadmap.md), [roadmap/mvp.md](roadmap/mvp.md), [roadmap/kpi.md](roadmap/kpi.md)
- [decisions/architecture_decisions.md](decisions/architecture_decisions.md)
- [../requirements/README.md](../requirements/README.md)
