# Status

> **이 폴더는 코드가 아니라 프로젝트 자체의 상태를 기록하는 공간이다.**
> `docs/`, `requirements/`, `backend/docs/`, `frontend/docs/`는 "무엇을/왜/어떻게
> 만드는가"를 정의하는 SSOT이고, `status/`는 그 SSOT와 실제 Backend
> (`jdukmin/lingon`)/Frontend(`jdukmin/letmeknow`) 저장소의 Commit
> History·Verification Report를 근거로 **"지금 어디까지 왔는가"**를
> 추적하는 프로젝트 관리 계층(Project SSOT)이다. 이 폴더는 기존 `docs/`
> 구조를 대체하지 않으며, 기존 문서를 변경하지도 않는다.

---

## 0. `status/`와 루트 `version/`·`changelog/`·`verification/`의 관계

이 저장소 루트에는 `status/`와 별개로 [../CLAUDE.md](../CLAUDE.md)가
정의하는 **기계 판독용** Version/ChangeLog 체계
(`version/*.json`, `changelog/*.md`)와 **Verification Report 저장소**
(`verification/backend/`, `verification/frontend/`)가 있다. 역할이
다르므로 중복이 아니다:

| | 목적 | 형식 | 갱신 주체/시점 |
|---|---|---|---|
| `version/*.json`, `changelog/*.md` | **현재 SemVer 버전 번호**의 단일 출처 — "지금 몇 버전인가"만 답한다 | JSON 1줄 + 짧은 bullet | API/DB/ICD **계약이 바뀔 때만** ([../CLAUDE.md](../CLAUDE.md) "Version 관리") |
| `verification/backend/`, `verification/frontend/` | 개별 변경 건의 검증 기록(변경 목적/파일/영향/테스트/남은 문제) | `<YYYY-MM-DD>-<주제>.md` | 실제 코드 변경을 검증할 때마다 |
| `status/` (이 폴더) | **프로젝트 진행 서사** — 어떤 버전에서 무엇이 왜 만들어졌고, Phase/Requirement 대비 지금 어디까지 왔는가 | 사람이 읽는 서술형 Markdown | 버전/Phase/Requirement Progress가 바뀔 때 |

`version/backend.json`이 "지금 몇 버전"이라고 답한다면, `status/backend/V<x>.md`는
"그 버전에서 무슨 일이 있었는가"에 답한다. 숫자가 바뀌면 반드시 두 곳이
함께 갱신되어야 한다 — 하나만 갱신하지 않는다.

---

## 1. 목적

1. **개발 이력 기록** — 실제 Backend/Frontend 저장소의 Commit History를
   버전 단위로 재구성한다([backend/](backend/), [frontend/](frontend/)).
2. **현재 상태 추적** — 프로젝트 전체가 지금 어느 Phase, 어느 Progress에
   있는지를 한 곳에서 확인할 수 있게 한다([current_status.md](current_status.md),
   [phase_status.md](phase_status.md)).
3. **로드맵 관리** — Phase 단위 계획과 완료 조건을 관리한다([roadmap.md](roadmap.md)).
4. **Requirement/SSOT/Verification Report와의 연결** — 모든 상태 기록은
   `requirements/`, `requirements/domain_icd/`, `docs/`, 그리고 실제
   저장소의 Verification Report(`FRONTEND_VERIFICATION_REPORT.md`,
   `BACKEND_VERIFICATION_REPORT.md`, `FRONTEND_SCHEMA_VERIFICATION_REPORT.md`,
   `BACKEND_SCHEMA_VERIFICATION_REPORT.md` — 각 소스 저장소 루트)를 근거로
   인용한다. 근거 없이 값을 매기지 않는다는 원칙은
   [requirements/README.md](../requirements/README.md)의 Status/Progress
   규칙을 그대로 계승한다.

---

## 2. 버전 정책 (Versioning Policy)

### 2.1 `V_0.1.0` — 최초 Baseline Release

**2026-07-29 기준, Backend/Frontend/DevDocs 모두 `V_0.1.0`을 최초
Baseline으로 확정한다.** `V0.0.x`(전부 실제 저장소의 진짜 Commit — 아래
§2.2)는 **개발 이력**이고, `V_0.1.0`은 그 이력 위에서 두 건의 독립적인
Verification/Schema Verification Report(Backend/Frontend 각각)가 실제
서버 실행·DB 조회·정적 코드 검증으로 확인한 상태를 하나의 **공식
기준점**으로 승격한 것이다. 이 시점 이후의 개발은 다음 순서를 따른다:

```
V_0.1.0 (Baseline, 현재)
  ↓
V_0.1.x  (Baseline 이후 patch/minor 반복)
  ↓
V_0.2.0
  ↓
V_1.0.0  (정식 출시)
```

`version/backend.json`/`version/frontend.json`/`version/system.json`이
이 번호의 기계 판독용 단일 출처다 — `status/`는 이 숫자를 그대로 따르되,
"왜 이 번호가 baseline인가"의 서사를 담당한다.

### 2.2 `V0.0.x` — 실제 저장소 Commit 기준

이전 버전의 이 문서는 `LingOnDevDocs`(문서 미러) 자체의 Commit History를
근거로 `status/backend`, `status/frontend`를 작성했다 — 이는 **부정확했다**:
문서 미러의 커밋은 "언제 어떤 문서를 옮겨 적었는가"를 기록할 뿐, 실제
Backend/Frontend 코드가 언제 무엇을 구현했는지와는 다른 이력이다. 이번
갱신부터 **실제 소스 저장소**(`github.com/jdukmin/lingon`,
`github.com/jdukmin/letmeknow`)의 Commit History를 1차 근거로 사용한다.

버전 번호는 각 저장소의 커밋 메시지에 실제로 기록된 태그를 그대로 쓴다 —
Backend와 Frontend는 **서로 다른 저장소이므로 버전 번호가 일치하지
않을 수 있다**(예: Backend는 `V_0.0.9`가 있지만 Frontend는 없음 — 각자
독립적으로 태그됨). 날짜 기준으로 최대한 같은 Timeline에 정렬해서
문서화했다.

| Backend(`lingon`) 실제 태그 | Frontend(`letmeknow`) 실제 태그 |
|---|---|
| (untagged 초기 커밋 4건 → V0.0.4에 흡수) | (untagged 초기 커밋 4건 → V0.0.4에 흡수) |
| V_0.0.4 | V_0.0.4 |
| — | V_0.0.5 |
| — | V0.0.6 |
| V_0.0.7 | V_0.0.7 |
| V_0.0.8(×2 커밋) | V_0.0.8(×2 커밋 + untagged 1건) |
| V_0.0.9 | — |
| V_0.0.10 | V_0.0.10 |
| V_0.0.11 | V_0.0.11 |
| — | V_0.0.12 |
| V_0.0.13 | V_0.0.13 |
| V_0.0.15 | V_0.0.15 |
| V_0.0.17 | V_0.0.17 |
| V0.1.0(Schema Verification + Baseline) | V0.1.0(Schema Verification + Baseline) |

태그 없는 커밋은 다음 태그된 버전에 흡수한다(예: Backend `backend claude
modifications`, `modified errors of V_0.0` → `V0.0.4`). 근거 없이 번호를
새로 만들지 않는다 — `.1~.3`, `.5~.6`(Backend), `.9`(Frontend), `.12`(Backend),
`.14`, `.16`처럼 한쪽에만 존재하거나 아예 없는 번호는 **그 저장소에 그
커밋이 없기 때문**이며 문서 누락이 아니다.

### 2.3 Backend/Frontend 버전 문서를 나누는 이유

Backend/Frontend는 서로 다른 GitHub 저장소(`jdukmin/lingon`,
`jdukmin/letmeknow`)이므로 각자 독립된 Commit History를 갖는다. 한쪽만
해당 버전에서 변경되었다면 그 쪽 폴더에만 문서를 만든다(빈 문서로 번호를
억지로 맞추지 않는다). 현재는 두 저장소 모두 거의 모든 태그 시점에
활동이 있어 이 예외가 드물다 — 상세 목록은 §2.2 표 참고.

---

## 3. 문서 작성 규칙

### 3.1 Version 문서 형식 (`backend/V<x>.md`, `frontend/V<x>.md`)

```markdown
# Version
V<x>

## Summary
## Major Changes
## Added
## Changed
## Fixed
## Architecture Impact
## Representative Commits
## Related Requirements
## Related Phase
## Current Status
```

- **Summary**: 이번 버전의 목적 한두 문단 — 커밋 메시지와 실제 diff가
  다를 경우(예: 메시지는 "OAuth"라는데 diff엔 없는 경우) 그 괴리도 명시한다.
- **Major Changes**: 가장 중요한 변경 1~5가지.
- **Added / Changed / Fixed**: 실제 diff(신규 파일 vs 기존 파일 수정)로
  판단한다. Verification Report가 발견한 버그 수정은 반드시 Fixed로
  분류하고 우선순위(P0~P3)를 표기한다.
- **Architecture Impact**: Domain ICD, API 계약, DB 스키마 등에 미친
  영향. 없으면 "없음"이라고 명시한다(추측 금지).
- **Representative Commits**: 실제 Git commit hash(짧은 형태) + 날짜 +
  원문 커밋 메시지 표.
- **Related Requirements**: `requirements/*_requirements.md`,
  `requirements/domain_icd/*.md` ID.
- **Related Phase**: [roadmap.md](roadmap.md)의 Phase 번호/이름.
- **Current Status**: 이 버전이 만든 기능의 **현재(최신 Verification
  Report 기준)** 상태 — Done/Superseded/Blocked 등, 근거 포함.

### 3.2 Status/Progress 표기

[requirements/README.md](../requirements/README.md)의 정의를 그대로
따른다.

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

값을 매길 때는 항상 근거(Requirement 근거 노트, FeatureList, 또는 실제
저장소의 Verification Report)를 인용한다. Verification Report가 "실제
서버/DB/curl로 확인"이라고 명시한 항목만 100%의 근거로 사용한다 — 정적
코드 리뷰만으로는 최대 75%까지만 인정한다(Frontend Schema Verification
Report처럼 Flutter SDK가 없어 `flutter test`/`build`를 실행하지 못한
경우가 실례).

### 3.3 Version History 관리 방법

1. Backend/Frontend 저장소에 새 커밋(또는 태그)이 생기면 `git log`/`git
   show --stat`으로 실제 변경 내용을 확인한다.
2. §3.1 형식으로 `status/{backend,frontend}/V<version>.md`를 작성하거나
   기존 문서에 추가한다.
3. [phase_status.md](phase_status.md)의 "관련 Version" 열을 갱신한다.
4. [current_status.md](current_status.md)를 최신 Progress 기준으로 갱신한다.
5. API/DB/ICD 계약이 바뀌었다면 **반드시** `version/*.json` +
   `changelog/*.md`도 함께 갱신한다([../CLAUDE.md](../CLAUDE.md) "Version
   관리" — 문서만 바뀌고 계약이 안 바뀌었으면 올리지 않는다).

### 3.4 Status 관리 방법

- Version 문서는 append-only에 가깝다 — 이후 새 Verification Report가
  그 버전의 내용을 뒤집으면(예: 버그 재발견) "Current Status" 절만 갱신한다.
- `current_status.md`, `phase_status.md`, `roadmap.md`는 최신 상태로 매번
  덮어쓴다.

---

## 4. 향후 관리 규칙 (모든 신규 기능에 적용)

`docs/workflow.md`(Step 0~6)의 SOP를 그대로 따르되, Step 6(Documentation
Update)을 아래 7단계로 세분화한다:

```
1. Requirements 수정        (requirements/*_requirements.md, 필요 시 domain_icd/*)
   ↓
2. Architecture 수정        (docs/strategy/, docs/icd/, requirements/domain_icd/)
   ↓
3. 구현                     (실제 backend/frontend 소스 저장소 — 이 저장소 아님)
   ↓
4. 테스트                   (실제 서버/DB/Flutter 실행 — Mock 결과 금지)
   ↓
5. Verification Report 작성 (실제 저장소에 <YYYY-MM-DD>-<주제>.md, 필요 시 이 저장소 verification/에도 사본)
   ↓
6. Version/ChangeLog 갱신   (version/*.json, changelog/*.md — 계약이 바뀐 경우만)
   ↓
7. status/ 갱신             (backend/frontend Version 문서, current_status.md, phase_status.md, 필요 시 roadmap.md)
```

**Requirement 없이 구현을 시작하지 않는다.** **구현에 맞춰 ICD/Requirement를
조용히 고치지 않는다**([docs/workflow.md](../docs/workflow.md) "ICD 변경
관리 규칙").

---

## 5. 관련 문서

- [roadmap.md](roadmap.md) — Phase 단위 계획(V_0.1.0 → V_0.2.0 → V_0.5.0 → V_1.0.0)
- [phase_status.md](phase_status.md) — Phase 단위 현재 상태
- [current_status.md](current_status.md) — 프로젝트 전체 현재 상태
- [../CLAUDE.md](../CLAUDE.md) — Version/ChangeLog/Verification Report 관리 규칙(기계 판독용 SSOT)
- [../version/](../version/), [../changelog/](../changelog/), [../verification/](../verification/) — 위 규칙이 관리하는 실제 파일
- [../requirements/README.md](../requirements/README.md) — Status/Progress 정의(SSOT)
- [../requirements/domain_icd/README.md](../requirements/domain_icd/README.md) — Domain ICD
- [../docs/workflow.md](../docs/workflow.md) — 개발 SOP(Step 0~6)
