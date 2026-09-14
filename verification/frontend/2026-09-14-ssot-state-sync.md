# SSOT State Sync — Frontend (TASK-007)

> Companion report: [../backend/2026-09-14-ssot-state-sync.md](../backend/2026-09-14-ssot-state-sync.md)
> (backend half of the same pass — database 스키마 정정, weather `error.code` 표).
>
> Governed by [../../CLAUDE.md](../../CLAUDE.md) "Verification Report Rule".
> Assessed against `docs@36cd588`, `letmeknow@ad08414`, `lingon@dd38b22`.

## 변경 목적

SSOT의 frontend/운영 문서가 **실행 결과와 정면으로 어긋나던 지점**을 정정한다.
이번 패스가 처음으로 Flutter 툴체인을 실제로 돌렸다 — 그 전까지 모든 보고서는
"Flutter SDK 미설치"를 전제로 작성되어 있었고, 그 전제가 틀렸다.

분류는 전부 **DevDocs Update Required**. 계약을 재해석한 것이 없다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `status/current_status.md` | 툴체인/테스트 실행 베이스라인 기록, blanket "자동 테스트 0건" 정정, Known Issues 갱신(D-1·D-2 해소 확인, D-3·weather error.code 해소), 신규 리스크 3건, 보류 중 version bump 명시 |
| `status/BETA_RELEASE_STATUS_REPORT.md` | 2026-09-14 갱신 이력, "Flutter SDK 미설치" 전제 제거, 저장소별 테스트 수 분리, 신규 리스크/블로커 반영 |
| `frontend/docs/DevelopmentGuide.md` | **Finding D-3** — `lib/auth/` 트리 정정(실제는 `lib/modules/auth/`), `lib/` 트리 전반을 실측에 맞춰 갱신 |
| `frontend/docs/FeatureList.md` | Weather 에러 매핑 P0 해소(미커밋) 반영, 테스트/analyze 실행 결과 기록, client `RouteException` 코드 갭 기록 |
| `docs/policies/error_policy.md` | 429 행 "envelope 미문서화 — 확인 필요" 정정, **Client-emitted `RouteException` 코드 표 신설(SSOT 최초 기록)** |
| `docs/ops/deployment_sop.md` | "배포 파이프라인 없음(0%)" 정정 — 실제 파이프라인, Flutter Web + Apache 정적 서빙에 따른 시크릿 노출, `current` 심볼릭 링크 롤백 절차 기록 |
| `verification/backend/2026-09-14-ssot-state-sync.md`, `verification/frontend/2026-09-14-ssot-state-sync.md` | 본 보고서 2건(신규) |
| `tasks/TASK-007-devdocs-state-sync.md` | Execution Log / Completion Result |

`status/release_state.md`는 Supervisor 소유 문서이므로 **읽고 참조만 했고
수정하지 않았다.**

본 저장소 밖(`letmeknow/`, `lingon/`)의 파일은 **한 건도 변경하지 않았다.**

## 영향 분석

### 정정된 잘못된 SSOT 주장

| 기존 주장 | 실제 | 위치 |
|---|---|---|
| "Flutter SDK 미설치 — analyze/test/build 미실행" | `flutter doctor` **No issues found**, Flutter 3.41.2 / Dart 3.11.0 | `current_status.md` §5, BETA 보고서 ~L35/L220/L324 |
| "양쪽 저장소 모두 자동 테스트 0건" | **절반만 사실**. Frontend **134 passing**, Backend 0 | BETA 보고서 ~L205/L208/L228/L270/L297 |
| Frontend 정적 분석 미검증 | `flutter analyze` → **No issues found!** | 동일 |
| `frontend/docs/DevelopmentGuide.md`의 `lib/auth/` 트리 | `lib/auth`는 **존재하지 않는다**. 실제는 `lib/modules/auth/`(flat, 4파일) | Finding D-3 |
| `docs/ops/deployment_sop.md` "배포 파이프라인 자체가 없다"(0%) | 3개 스크립트가 실제 rsync + Apache 심볼릭 링크 배포를 구현 | — |
| `error_policy.md` 429 "envelope 형태 미문서화 — 확인 필요" | `RATE_LIMITED`/429/ICD v0.0으로 이미 확정 | `src/app.ts:192-197` |

### 이미 고쳐져 있던 것(재적용하지 않음)

Finding **D-1**(FeatureList Calendar "로컬 캘린더 완료/Google 동기화 예정")과
**D-2**(401 자동 재시도 인터셉터 "미연결")는 **2026-07-29 패스에서 이미 원본
문서에 정정되어 있었다** — `frontend/docs/FeatureList.md:24`, `:74-79`,
`docs/policies/error_policy.md:41`의 정정 주석으로 확인. 따라서 이번 패스는
이 둘을 다시 고치지 않았고, 대신 `current_status.md` §5가 "원본은 아직 수정하지
않음"이라고 기술하던 **그 문장이 이제 stale**이므로 그쪽을 정정했다.
세 findings 중 실제로 열려 있던 것은 **D-3 하나뿐**이다.

### 새로 기록된 것(SSOT 어디에도 없던 사실)

1. **Flutter Web + Apache 정적 서빙의 보안 결과**. `compile_release.sh`가
   `build/web/`을 `/var/www/lingon/releases/<timestamp>/`로 rsync하고 Apache가
   `current` 심볼릭 링크로 서빙한다 ⇒ **모든 `--dart-define` 값은 배포된
   JS에서 누구나 읽을 수 있다.** 그래서 같은 스크립트에
   `assert_no_secret_defines()` 가드가 들어갔다. 어떤 ops/status 문서도 이
   결과를 기술한 적이 없었다.
2. **롤백 절차가 실제로 존재한다** — `current` 심볼릭 링크를 이전
   `releases/<timestamp>`로 되돌리고 Apache reload. 이전 릴리즈는 디스크에
   남는다. `deployment_sop.md`가 "롤백 스크립트 없음"이라고만 기술하던 공백.
3. **Client-emitted `RouteException` 코드 8종** — `TIMEOUT`,
   `CLIENT_EXCEPTION`, `NETWORK_ERROR`, `HTTP_EXCEPTION`, `FORMAT_ERROR`,
   `INVALID_JSON_OBJECT`, `HTTP_<status>`, `UNKNOWN_ERROR`. 출처
   `lib/core/utils/error_handler.dart:38`/`:45`/`:52`/`:59`/`:65`/`:93-96`,
   `lib/core/base/base_route.dart:74`/`:76`/`:214-216`(외 4쌍). 서버가 보낸
   적 없는 **클라이언트 자체 코드**이며 SSOT 어디에도 없었다.
   정책적 함의: 공통 규칙("Frontend는 `error.code`로 자체 문구를 표시한다")을
   지키려면 매퍼가 서버 코드와 이 코드를 **모두** 처리해야 한다.
4. **`compile_release.sh`가 깨져 있었다** — `set -euo pipefail` 아래에서
   정의된 적 없는 `FLUTTER_DEFINE_ARGS`를 사용 ⇒ 릴리즈 빌드가 항상 중단.
   TASK-001에서 수정(미커밋).

### Version / ChangeLog 영향 — **없음(의도적)**

오늘의 코드 변경은 **전부 미커밋 작업 트리 상태**다
(`compile_release.sh` 수정, `weather_error_mapper.dart`,
`brief_error_mapper.dart`, 신규 테스트 36건). `version/frontend.json`의
`known_discrepancy`가 세운 선례 — "Version 관리 rule requires actual committed
implementation, and uncommitted working-tree code doesn't qualify" — 를 그대로
적용해 **version bump도, ChangeLog 항목도 작성하지 않았다.**
`docs/CLAUDE.md` "Version 관리"상 계약을 바꾸지 않는 status 정정 역시 bump
대상이 아니다.

보류 중인 bump(커밋 이후에만 유효):
frontend Patch `0.1.2` → `0.1.3` — `compile_release.sh` 수정 +
`assert_no_secret_defines()` 가드(TASK-001), `weather_error_mapper.dart` +
`brief_error_mapper.dart`(TASK-002), 신규 테스트 36건.

## 테스트 결과

이 저장소에는 실행할 소스가 없다. 아래는 **실제로 실행한 명령과 그 출력**이며
mock이 아니다. 실행 일자: 2026-09-14, 이 머신.

| 명령 | 출력 |
|---|---|
| `cd letmeknow && flutter doctor` | `[✓] Flutter (Channel stable, 3.41.2 …)` 전 항목 ✓ — **No issues found!** |
| `cd letmeknow && flutter analyze` | **No issues found! (ran in 1.8s)** |
| `cd letmeknow && flutter test` | **`00:02 +134: All tests passed!`** (exit 0, 실패 0건, 15개 테스트 파일) |
| `cd lingon && ./node_modules/.bin/tsc -p tsconfig.json --noEmit` | exit 0, 출력 없음 — clean |
| `cd lingon && npm audit` | **7 vulnerabilities (2 low, 2 moderate, 3 high)** |
| Backend 자동 테스트 | 검증 기준점(`dd38b22`)에서 **0건** |

**134의 구성**: 커밋 `ad08414` 시점 98건 + 2026-09-14 추가 36건(미커밋).
추가분은 untracked 3개 파일 —
`test/core/modules/weather_icon_error_mapping_test.dart`,
`test/modules/brief/brief_error_mapping_test.dart`,
`test/modules/weather/weather_error_mapping_test.dart`.

> **주의 — 문서에 남은 오래된 수치**: 이번 작업 도중 유통되던 "113 passing
> (98 + 15)"은 **당일 중간 집계값이며 폐기되었다.** 재실행 결과 134가 정확한
> 값이다. 98 + 36 = 134로 정합한다. 향후 어떤 문서도 113을 인용해서는 안 된다.

`flutter analyze`가 함께 보고한 `55 packages have newer versions incompatible
with dependency constraints`는 `release_state.md` §5의 "55
version-constrained Flutter packages (P4)" 항목과 일치한다.

문서 검증(빌드가 없으므로 이것이 evidence):

- 새로 쓴 모든 주장의 `file:line` 인용을 `sed -n '<line>p'`로 개별 확인.
  2건 교정: rate-limit `max`는 `app.ts:182`(`:183`이 아님),
  `HTTP_<statusCode>` fallback은 `error_handler.dart:93-96`(`93-95`가 아님).
- `lib/` 트리는 `find lib -type d` / `ls` 실측 결과로 대조했다.
- 모든 상대 링크 대상 파일의 존재를 확인했다.
- 편집한 문서를 전부 재독해 내부 모순이 남지 않았음을 확인했다.

소스 저장소 무변경 증거 — 작업 시작 시점 스냅샷과 종료 시점 대조:

```
$ git -C letmeknow status --porcelain
 M compile_release.sh
 M lib/core/modules/weather_icon_module.dart
 M lib/modules/brief/brief_module.dart
 M lib/modules/weather/weather_module.dart
 M linux/flutter/generated_plugin_registrant.cc
 M linux/flutter/generated_plugin_registrant.h
 M linux/flutter/generated_plugins.cmake
 M windows/flutter/generated_plugin_registrant.cc
 M windows/flutter/generated_plugin_registrant.h
 M windows/flutter/generated_plugins.cmake
?? lib/modules/brief/brief_error_mapper.dart
?? lib/modules/weather/weather_error_mapper.dart
?? test/core/modules/
?? test/modules/
```

이 목록은 **이 작업 이전부터 존재하던 항목**(TASK-001/002의 미커밋 결과물)이며
본 패스가 추가하거나 변경한 항목은 없다. `flutter test`/`flutter analyze`
실행 후에도 동일함을 스냅샷 대조(`diff`)로 확인했다 — 빌드 산출물은
`.gitignore`의 `.dart_tool/`·`build/`에 포함된다.

## 남은 문제

1. **Client `RouteException` 코드의 정식 위치** — 이번 패스는
   `error_policy.md`에 표로 기록했다. Frontend ICD(`frontend/docs/`) 쪽에도
   정식 항목이 필요한지는 미결. (P3)
2. **`frontend/docs/DevelopmentGuide.md` 트리 외의 stale 기술** — 트리는
   실측에 맞췄으나, 문서 나머지(API 호출 방식, Error Handling 절 등)가 현재
   코드와 일치하는지는 이번 패스에서 전수 대조하지 않았다. (P3)
3. **`run_release.sh`의 실제 결함 2건** — TLS 키 경로가 `.pem`이 아니라
   `.pe`로 끝난다(파일명 절단 의심), 그리고 이 스크립트는 `flutter run`
   개발 서버라 Apache `current` 심볼릭 링크 경로를 완전히 우회한다.
   문서에 열린 갭으로 기록했을 뿐 **고치지 않았다** — 소스 수정은 이
   저장소의 권한 밖이다. (P2)
4. **Backend 배포는 빌드뿐** — `lingon/server_deploy.sh`는
   `npm install` + `npm run build`만 한다. 프로세스 재시작/리로드가 없다.
   `server_init.sh`가 PM2를 설치하지만 어떤 스크립트도 PM2를 호출하지 않는다.
   프로세스 기동은 문서화되지 않은 수동 단계다. (P2)
5. **오래된 릴리즈 디렉터리를 정리하는 것이 없다**, 자동 롤백 트리거도 없다. (P3)
6. **미커밋 상태** — 오늘 코드 변경 전부가 작업 트리에만 있다. 커밋 전까지
   frontend Patch bump `0.1.2` → `0.1.3`과 ChangeLog는 작성할 수 없다.
7. **실기기/실계정 검증 미수행** — 사람만 할 수 있는 항목이며
   `status/required_human_resource.md`가 계속 authoritative.
