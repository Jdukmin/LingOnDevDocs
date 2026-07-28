# Status

> **이 폴더는 코드가 아니라 프로젝트 자체의 상태를 기록하는 공간이다.**
> `docs/`, `requirements/`, `backend/docs/`, `frontend/docs/`는 "무엇을/왜/어떻게
> 만드는가"를 정의하는 SSOT이고, `status/`는 그 SSOT를 근거로 **"지금 어디까지
> 왔는가"**를 추적하는 별도의 관리 계층이다. 이 폴더는 기존 `docs/` 구조를
> 대체하지 않으며, 기존 문서를 변경하지도 않는다 — 오직 그것들을 읽고
> 요약·추적한다.

---

## 1. 목적

1. **개발 이력 기록** — `V_0.0` 브랜치의 Commit History를 Backend/Frontend
   관점에서 버전 단위로 재구성한다([backend/](backend/), [frontend/](frontend/)).
2. **현재 상태 추적** — 프로젝트 전체가 지금 어느 Phase, 어느 Progress에
   있는지를 한 곳에서 확인할 수 있게 한다([current_status.md](current_status.md),
   [phase_status.md](phase_status.md)).
3. **로드맵 관리** — Phase 단위 계획과 완료 조건을 관리한다([roadmap.md](roadmap.md)).
4. **Requirement/SSOT와의 연결** — 모든 상태 기록은 `requirements/`,
   `requirements/domain_icd/`, `docs/`의 근거를 인용한다. 근거 없이 값을
   매기지 않는다는 원칙은 [requirements/README.md](../requirements/README.md)의
   Status/Progress 규칙을 그대로 계승한다.

`status/`는 프로젝트 관리의 Single Source of Truth 역할을 한다 — Progress를
알고 싶으면 여기부터 본다. 단, `status/`의 값 자체는 항상 `requirements/`,
`docs/`의 근거에서 파생된 것이며, 그 반대가 아니다(즉 `status/`가 새로운
사실을 만들지 않는다 — 기존 SSOT를 재구성·요약할 뿐이다).

---

## 2. 버전 정책 (Versioning Policy)

### 2.1 현재 단계 — `V0.0.x`

프로젝트는 아직 정식 출시 전이므로 모든 버전을 `V0.0.x` 형식으로 관리한다.
버전 번호는 **실제 `V_0.0` 브랜치 Commit Message에 이미 기록된 번호를
그대로 사용한다** — 임의로 1부터 순번을 다시 매기지 않는다. 이는
[requirements/README.md](../requirements/README.md)의 "근거 없이 값을 매기지
않는다" 원칙을 버전 번호에도 동일하게 적용한 것이다.

```
git log 기준 실제 버전 태그: V_0.0.7, V_0.0.9, V_0.0.11, V_0.0.12, V_0.0.14, V_0.0.16
```

**번호가 연속되지 않는 이유(`.1~.6`, `.8`, `.10`, `.13`, `.15` 없음)**: 이
저장소(`LingOnDevDocs`)의 Commit History에 해당 번호의 커밋이 존재하지
않는다 — 실제 코드 저장소(backend/frontend)에서는 존재했을 수 있으나, 이
문서 미러 저장소에는 기록이 없다. `status/`는 **근거가 있는 버전만
문서화한다** — 존재하지 않는 근거로 `V0.0.1~V0.0.6` 등을 추정해 만들지
않는다.

버전 번호 없이 커밋된 두 건(`Readme added.`, `changed port`)은 아래처럼
논리적으로 인접 버전에 흡수했다(본 규칙의 "Commit이 여러 개인 경우
논리적으로 하나의 Version으로 묶어도 된다" 조항 적용):

| Commit | 흡수된 버전 | 이유 |
|---|---|---|
| `0346f3c` "Readme added." (2026-07-06) | `V0.0.7`의 준비 단계로 기록 | 이후 커밋인 `V_0.0.7`(문서 포털 + 전체 초기 문서 세트)의 직전 준비 커밋이며, 그 자체로는 버전 번호가 없다 |
| `3b5f8d8` "changed port" (2026-07-18) | `V0.0.11` 안에 각주로 기록 | `V_0.0.11`과 같은 날짜(2026-07-18)의 사소한 인프라 변경(포털 서버 포트) — 별도 버전으로 분리할 실질 내용이 없다 |

### 2.2 `V1.0` 이후 — Semantic Versioning

`V1.0.0`부터는 표준 [Semantic Versioning](https://semver.org/)
(`MAJOR.MINOR.PATCH`)을 사용한다 — `docs/ops/deployment_sop.md`의
Versioning Rule(앱은 Semantic Versioning, ICD는 하위 호환 규칙)과 동일한
원칙이다. 전환 시점은 [roadmap.md](roadmap.md) Phase 6(V1.0 Release
Readiness) 완료 시점과 일치시킨다.

### 2.3 Backend/Frontend 버전 문서를 나누는 이유

이 저장소는 Backend/Frontend 소스가 하나의 커밋 히스토리(`V_0.0` 브랜치)로
합쳐진 문서 미러다. 그러나 실제 구현은 Backend/Frontend가 분리된 코드베이스이므로,
`status/backend/`와 `status/frontend/`를 나누어 **각 영역이 실제로 변경된
버전에 대해서만** 문서를 작성한다.

> **한쪽만 변경된 버전은 그 쪽 폴더에만 문서를 만든다.** 예: `V0.0.12`는
> Backend(`backend/docs/api/calendar.md` 등)만 변경되었고 Frontend는 변경이
> 없었다 — 따라서 `status/backend/V0.0.12.md`만 존재하고
> `status/frontend/V0.0.12.md`는 만들지 않는다(내용 없는 빈 문서를 만들어
> 버전 번호를 억지로 맞추지 않는다 — 문서 중복/노이즈 방지).

| 버전 | Backend 문서화 | Frontend 문서화 |
|---|---|---|
| V0.0.7 | ✅ | ✅ |
| V0.0.9 | ✅ | ✅ |
| V0.0.11 | ✅ | ✅ |
| V0.0.12 | ✅ | ❌ (변경 없음) |
| V0.0.14 | ✅ | ✅ |
| V0.0.16 | ✅ | ✅ |

`V0.0.14`/`V0.0.16`은 대부분의 변경이 `docs/`, `requirements/`(Domain
ICD·전략·정책·ICD 제안)에 집중된 버전이다 — 이런 cross-cutting 변경은
`backend/`, `frontend/` 어느 한쪽 소유가 아니므로, 각 버전 문서의 "Related
Documents" 절에서 근거로 인용하되, "Major Changes"는 실제로 `backend/docs`
또는 `frontend/docs`에 있었던 변경만 기술한다(사실과 다른 내용을 만들지
않는다).

---

## 3. 문서 작성 규칙

### 3.1 Version 문서 형식 (`backend/V0.0.x.md`, `frontend/V0.0.x.md`)

```markdown
# Version
V0.0.x

## Summary
## Major Changes
## Added
## Changed
## Fixed
## Architecture
## Related Documents
## Commit Reference
## Notes
```

- **Summary**: 이번 버전의 목적 한두 문단.
- **Major Changes**: 이번 버전에서 가장 중요한 변경 1~3가지.
- **Added / Changed / Fixed**: Commit Message + 변경 파일 Diff를 근거로
  신규/변경/수정을 구분한다. 커밋 메시지가 "fixed"라고 명시한 항목만 Fixed로
  분류하고, 나머지는 실제 diff 내용(신규 파일 vs 기존 파일 수정)으로 판단한다.
- **Architecture**: 이 버전이 Domain ICD, API 계약, DB 스키마, 정책 등
  아키텍처 수준에 미친 영향. 없으면 "없음"이라고 명시한다(추측 금지).
- **Related Documents**: 관련 `requirements/*_requirements.md`,
  `requirements/domain_icd/*.md`, `docs/*` 근거를 링크한다.
- **Commit Reference**: 실제 Git commit hash(짧은 형태) + 원문 커밋 메시지.
- **Notes**: 향후 계획, 알려진 제약, 후속 버전에서 다룰 항목.

### 3.2 Status/Progress 표기

`status/` 전체에서 사용하는 Status/Progress 값은
[requirements/README.md](../requirements/README.md)의 정의를 그대로
따른다 — 이 문서가 별도의 값 체계를 만들지 않는다.

**Status**: `Planned` → `In Progress` → `Review` → `Done` (또는 `Blocked` /
`Cancelled`)

**Progress**: `0% / 25% / 50% / 75% / 100%`

| Progress | 기준 |
|---|---|
| 0% | Requirement만 존재 |
| 25% | UI 또는 Backend 한쪽만 구현 |
| 50% | Frontend + Backend 구현 완료, 연동 미완료 |
| 75% | Frontend + Backend + API 연동 완료, 실제 테스트 미완료 |
| 100% | 실제 동작 확인 + 테스트 완료 + Requirement 충족 확인 |

값을 매길 때는 항상 근거 문서(`requirements/*`, `backend/docs/FeatureList.md`,
`frontend/docs/FeatureList.md`)를 인용한다 — 이 저장소는 소스 코드가 없는
문서 미러이므로, 실제 코드 확인 없이는 100%를 표기하지 않는다는 제약도
동일하게 적용된다.

### 3.3 Version History 관리 방법

1. 새 버전 커밋이 생기면 해당 버전이 Backend/Frontend 중 무엇을 바꿨는지
   `git show --stat`으로 확인한다.
2. 변경된 쪽에만 `status/{backend,frontend}/V<version>.md`를 작성한다
   (§2.3 규칙).
3. §3.1 형식을 따라 작성하고, `requirements/`·`docs/` 근거를 반드시
   인용한다.
4. [phase_status.md](phase_status.md)의 "관련 Version" 열에 새 버전을
   추가한다.
5. [current_status.md](current_status.md)를 최신 Requirement Progress
   기준으로 갱신한다.
6. 기능 완료로 Requirement Status/Progress가 바뀐 경우, 그 Version 문서의
   "Related Documents"에 어떤 Requirement가 완료됐는지 명시한다(§4 참고).

### 3.4 Status 관리 방법

- `status/` 문서 자체는 "현재 상태의 스냅샷"이다 — 과거 버전 문서를 다시
  쓰지 않는다(Version 문서는 append-only에 가깝다. 예외: 그 버전 이후 실제
  코드 확인으로 Progress가 바뀐 경우에 한해 해당 버전 문서에 정정 노트를
  추가한다).
- `current_status.md`, `phase_status.md`는 최신 상태를 반영하도록 매번
  덮어쓴다(스냅샷이 아니라 최신 상태 문서).
- Status/Progress 변경의 근거는 항상 `requirements/`의 근거 노트를 그대로
  인용한다 — `status/`에서 새로 판단하지 않는다.

---

## 4. 향후 관리 규칙 (모든 신규 기능에 적용)

`docs/workflow.md`(Step 0~6: Domain Freeze → Backend 개발/검증 → Frontend
개발/검증 → 통합 검증 → 문서 갱신)가 이미 정의한 SOP를 그대로 따르되, 이
문서의 Step 6(Documentation Update)을 아래처럼 더 구체적인 7단계로
확장한다 — `docs/workflow.md`를 대체하는 것이 아니라 그 마지막 단계를
`status/` 관점에서 세분화한 것이다.

```
1. Requirements 수정        (requirements/*_requirements.md, 필요 시 domain_icd/*)
   ↓
2. Architecture 수정        (docs/strategy/, docs/icd/, requirements/domain_icd/)
   ↓
3. 구현                     (backend/, frontend/ 실제 소스 저장소)
   ↓
4. 테스트                   (docs/workflow.md Step 2/4/5 — 실제 실행 검증)
   ↓
5. Version History 작성     (status/{backend,frontend}/V<version>.md — §3.1 형식)
   ↓
6. Status 업데이트          (status/current_status.md, status/phase_status.md)
   ↓
7. Roadmap 업데이트(필요 시) (status/roadmap.md — Phase 완료 조건 충족 시)
```

**Requirement 없이 구현을 시작하지 않는다**
([requirements/README.md](../requirements/README.md)와 동일한 원칙).
**구현에 맞춰 ICD/Requirement를 조용히 고치지 않는다**
([docs/workflow.md](../docs/workflow.md) "ICD 변경 관리 규칙"과 동일한 원칙).

### Version History 업데이트 규칙

새로운 기능이 완료되면 해당 Version 문서(없으면 새로 생성)를 갱신하며,
아래 네 가지를 반드시 기록한다:

1. **무엇을 만들었는지** (Added/Changed/Fixed)
2. **왜 만들었는지** (Summary — 어떤 제품 우선순위/Phase에 해당하는지)
3. **어떤 Requirement가 완료되었는지** (Related Documents — Requirement ID
   + Status/Progress 변경)
4. **어떤 Architecture가 변경되었는지** (Architecture 절 — Domain ICD, API
   계약, DB 스키마 등)

---

## 5. 관련 문서

- [roadmap.md](roadmap.md) — Phase 단위 계획
- [phase_status.md](phase_status.md) — Phase 단위 현재 상태
- [current_status.md](current_status.md) — 프로젝트 전체 현재 상태
- [../requirements/README.md](../requirements/README.md) — Status/Progress 정의(SSOT)
- [../requirements/domain_icd/README.md](../requirements/domain_icd/README.md) — Domain ICD
- [../docs/workflow.md](../docs/workflow.md) — 개발 SOP(Step 0~6)
- [../docs/roadmap/roadmap.md](../docs/roadmap/roadmap.md), [../docs/roadmap/mvp.md](../docs/roadmap/mvp.md) — 이 폴더의 Phase/Tier 근거 원본
