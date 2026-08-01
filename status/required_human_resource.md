# Required Human Resource

> AI(Claude)가 코드/문서 수준에서 수행할 수 없는 작업 — 계정 생성, 결제,
> 법률 검토, 실기기 조작, 사업 판단처럼 물리적 접근·법적 자격·실물 심사가
> 필요한 항목만 담는다. Claude가 수행 가능한 항목(코드 구현, 문서 작성,
> 정적 검증)은 여기 포함하지 않는다 — [BETA_RELEASE_STATUS_REPORT.md](BETA_RELEASE_STATUS_REPORT.md)
> "Remaining Development"가 그 몫을 다룬다.
>
> **근거 원칙**: [README.md](README.md)와 동일 — 근거 없이 상태를 매기지
> 않는다. "완료 여부"는 저장소에서 확인 가능한 근거가 있을 때만
> 확정적으로 쓰고, 저장소 밖의 실제 계정/결제/등록 상태는 "확인 필요"로
> 표기한다(Claude는 외부 계정 상태를 조회할 수 없다).
>
> **Last Updated**: 2026-08-02 — AI Platform(LLM Gateway) 관련 6건 추가.
> 이전 갱신: 2026-07-29 (V_0.1.0 Baseline 기준).
> 근거: [docs/ai_platform/2026-08-01-ai-platform-review.md](../docs/ai_platform/2026-08-01-ai-platform-review.md) §8,
> [requirements/domain_icd/llm.md](../requirements/domain_icd/llm.md)(System V_0.2.0 계약 확정).
> 이 갱신은 **Status 문서 변경**이며 계약을 바꾸지 않으므로 Version을 올리지
> 않는다([CLAUDE.md](../CLAUDE.md) Version 관리 — "문서만 바뀌고 계약이 바뀌지
> 않았다면 version을 올리지 않는다").

---

## Release

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| Google Play Console 개발자 계정 등록($25 1회) 및 앱 등록 | Critical | Beta(내부 테스트 트랙)는 V_0.1.x부터 가능, 공개 배포는 V_1.0.0 직전 | 미완료 — `android/app/build.gradle.kts`에 release 서명 설정 없음, keystore 없음(`frontend/docs/FeatureList.md` TODO "Release APK 서명 키 설정") |
| Apple Developer Program 등록($99/년) 및 App Store Connect 앱 등록 | Critical | V_1.0.0 직전(iOS는 Beta 범위에서 제외 가능) | 미완료 — `frontend/docs/FeatureList.md` TODO에 "iOS `GoogleService-Info.plist` 등록"이 남아있어 iOS 빌드 자체가 배포 준비 전 단계 |

> Privacy Policy/Terms 작성은 [Legal](#legal) 카테고리로 이동했다(2026-07-29,
> 카테고리 재정리 — 내용 변경 없음).

## Legal

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| 개인정보처리방침(Privacy Policy) 실제 법률 문서 작성 | Critical | Beta 공개 배포 전(Play Store/App Store 제출 필수 항목) | 미완료 — `docs/policies/privacy_policy.md`는 "요구사항 정리이지 실제 정책 문서가 아니다"로 명시(Status: Not Started, 0%) |
| 이용약관(Terms of Service) 작성 | Critical | 위와 동일 시점 | 미완료 — 동일 문서, 동일 사유 |
| **사용자 대화 내용의 제3자 LLM Provider 전송에 대한 개인정보/법률 승인** (OpenAI·Google과의 데이터 처리 조건, 보관 기간, 처리 리전 확인 포함) | Critical | **AI Platform 구현 착수 전 — 🚫 Blocker** | 미착수 — 현재는 Flutter 클라이언트가 OpenAI를 직접 호출하고 있고(`frontend/docs/services/LlmService.md`), Backend LLM Gateway 도입 시 전송 주체가 백엔드로 바뀐다. `docs/policies/privacy_policy.md`는 "요구사항 정리이지 실제 정책 문서가 아님"(Status: Not Started) 상태라 승인 근거가 없다. 승인 완료 시 privacy_policy 갱신 필요 — [docs/ai_platform/2026-08-01-ai-platform-review.md](../docs/ai_platform/2026-08-01-ai-platform-review.md) §7 U9 |
| BYOK 책임 소재 조항(사용자가 자신의 LLM Provider 키 사용량/비용을 직접 부담) 법률 검토 | High | Terms 작성과 동시 | 미착수 — `docs/policies/privacy_policy.md` "Terms 요구사항" 항목으로만 정리됨, 실제 조항 문구는 없음. [requirements/domain_icd/llm.md](../requirements/domain_icd/llm.md) §CredentialSource가 `byok`를 정식 계약으로 확정(2026-08-01)해 조항의 대상이 명확해졌다 |
| Action 실행 면책 조항(향후 Home Assistant/NAS 등 실제 부작용 있는 Action의 오작동 책임 범위) 법률 검토 | Medium | Phase 10(Connector 확장) 착수 전 | 미착수 — 동일 문서, Beta 범위에서는 아직 실물 Action이 없어 낮은 시급성 |
| 미성년자 이용 제한 여부 검토 | Medium | Terms 작성과 동시 | 미착수 — `docs/policies/privacy_policy.md` "검토 필요"로만 명시 |
| 사용자 데이터 삭제(계정 삭제) 정책의 법적 요건 검토(GDPR류 지역 대상 서비스 여부 포함) | Medium | 공개 배포 전 | 미착수 — `userRepository.deleteUser(id)`는 코드에 존재하나 이를 노출하는 API/화면이 없음(`docs/policies/privacy_policy.md` "사용자 데이터 삭제 정책") |

## Cloud

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| 프로덕션 서버 구축(호스팅 계정, 인스턴스 프로비저닝) | Critical | Beta 배포 직전 | 부분 완료 — `server_init.sh`/`server_deploy.sh` 스크립트는 존재(`backend/docs/deployment/README.md`)하나, 실제 라이브 서버가 떠 있는지는 저장소로 확인 불가. `docs/workflow.md` "AI 조직 운영 구조"가 DevOps 실제 산출물을 "아직 없음"으로 명시 |
| 도메인 연결 | High | Beta 배포 직전 | 확인 필요 — `lib/core/network/api_client.dart`의 기본 `baseUrl`이 이미 `https://www.ling-on.com`으로 설정되어 있어 도메인 자체는 확보된 것으로 보이나, DNS/실제 서버 연결 상태는 저장소 밖이라 확인 불가 |
| SSL/TLS 인증서 발급 및 리버스 프록시 설정 | Critical | Beta 배포 직전 | 미완료 — `docs/docs/policies/security_policy.md` "HTTPS: 미문서화 — 확인 필요"; 토큰이 URL fragment/`Authorization` 헤더로 전송되는 설계상 HTTPS는 사실상 필수 전제 |
| 운영환경 배포 자동화(프로세스 매니저 기동/재시작) | High | Beta 배포 직전 | 부분 완료 — `server_deploy.sh`는 빌드만 하고 프로세스를 시작/재시작하지 않음(`backend/docs/deployment/README.md` "neither script starts or restarts the process") |
| **LLM Provider별 비용 상한·사용량 알림 설정**(각 Provider 콘솔의 budget/quota 설정) | High | LLM Gateway가 실제 트래픽을 받기 시작하는 시점 | 미착수 — [requirements/llm_gateway_requirements.md](../requirements/llm_gateway_requirements.md) LLM-004(Cost Monitoring)는 Planned/0%이고, 이를 담을 `usage_logs` 테이블도 존재하지 않는다. 애플리케이션 측 Circuit Breaker와 별개로 **Provider 콘솔 측 상한**은 사람이 설정해야 한다 |

## OAuth

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| Google OAuth Verification(민감 스코프 `calendar.readonly` 심사) | Critical | 테스트 사용자 목록을 벗어나 공개 배포하기 전(Beta 공개 시점) | 미완료 — `docs/docs/policies/privacy_policy.md` "Google 보안 심사... 현재 미착수" |
| 프로덕션 Redirect URI 등록(`GOOGLE_CALLBACK_URL`, `GOOGLE_CALENDAR_CALLBACK_URL`을 Google Cloud Console에 등록) | Critical | Beta 배포 직전 | 확인 필요 — 백엔드는 이 값들을 env var로만 읽는다(`backend/docs/plugins/google-oauth.md`); Google Cloud Console 콘솔 측 등록 상태는 저장소로 확인 불가 |
| 프로덕션용 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` 발급(테스트용과 분리) | Critical | Beta 배포 직전 | 확인 필요 — 코드는 두 값이 존재한다고만 가정(`.env` 기반), 실제 발급 여부는 Google Cloud Console에서만 확인 가능 |

## External Service

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| **LLM Gateway 검증용 실제 Provider API Key 발급**(OpenAI 또는 Gemini 중 최소 1개 — `PUT /v1/apikey/:provider`로 등록해 실제 호출까지 확인) | High | **AI Platform 구현 착수 전 — 🚫 Blocker** | 미착수 — [docs/workflow.md](../docs/workflow.md) "Real Execution Only" 원칙상 Mock 결과는 검증으로 인정되지 않는다([CLAUDE.md](../CLAUDE.md) Verification Report Rule "Mock 결과를 성공으로 보고하지 않는다"). 실제 키 없이는 Backend 구현 프롬프트의 Test 요구사항(정규화 응답·에러 경로·사용자별 격리)을 충족할 수 없다 |
| **OpenAI 운영 API 계정 확보**(조직 설정, 결제 수단, 사용 티어 확인) | High | Platform-funded 모드를 채택하는 경우에 한해 구현 착수 전; 순수 BYOK면 불필요 | 미착수 — 필요 여부 자체가 아래 Business 카테고리의 "BYOK vs Platform-funded 과금 주체 결정"에 종속된다. 코드상 `OPENAI_API_KEY` 환경변수를 읽는 자리는 있으나(`src/config/env.ts`) 이를 소비하는 게이트웨이가 없다 |
| **Google AI(Gemini) 접근 확보** — Google AI Studio API Key 발급 *또는* GCP Vertex AI 프로젝트 생성 + 결제 연결 + Generative Language API 활성화 | High | 위와 동일 | 미착수 — 콘솔/결제 작업이라 저장소에서 수행 불가. `gemini`는 이미 BYOK provider allow-list에 포함되어 있다(`backend/docs/api/apikey.md`) |
| OpenWeather API 운영 Key 확보(무료 티어 rate limit이 실사용량을 감당하는지 확인) | High | Beta 트래픽이 늘어나는 시점(배포 직후~) | 확인 필요 — `OPENWEATHER_API_KEY`가 필수 환경변수로 문서화만 되어 있음(`backend/docs/deployment/README.md`); 실제 키의 등급/한도는 저장소 밖 |
| Google Calendar 운영 설정 확정(위 OAuth 항목과 연동 확인) | Critical | Beta 공개 배포 전 | 미완료 — OAuth 섹션과 동일 근거 |
| Home Assistant 실기기 연동 테스트 | Low | Phase 10(Connector 확장, `V_0.5.0` 목표) 착수 시점 | 미착수 — Phase 10 자체가 `Status: Planned, Progress: 0%`(`status/roadmap.md`), Beta 범위 밖 |

## Security

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| 전문 보안 점검(침투 테스트 또는 외부 코드 감사) | High | Beta 공개 배포 전 | 미완료 — Backend/Frontend Schema Verification Report는 자동화된 정적/제한적 실행 검증이며, 전문 보안 감사를 대체하지 않는다 |
| 운영 Secret 관리 체계 도입(KMS/Vault, 키 rotation, 유출 대응 절차) | Medium | `V_1.0.0` 이전 | 미완료 — `docs/docs/policies/security_policy.md` "현재 전부 `.env` 기반... KMS/rotation 정책 없음" |
| HTTPS/CORS/Cookie 속성(`Secure`/`SameSite`) 실제 설정값 확정 및 검증 | Critical | Beta 배포 직전 | 미확인 — `security_policy.md`가 CORS를 "`origin: true`로 완전 개방"이라고 확인함(Backend Schema Verification Report), 프로덕션 전 allow-list 전환 필요 |

## Monitoring

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| 에러 트래킹 서비스(Sentry 등) 계정 개설 및 프로덕션 연동 | High | Beta 배포 직전~직후 | 미착수 — `docs/ops/monitoring.md` "Sentry: 미도입. `raw_logs`의 `unhandled_exception` 행이 유일한 예외 기록 수단" |
| 메트릭/대시보드 서비스(Prometheus+Grafana 자체 호스팅 또는 관리형 서비스) 선정 및 구축 | Medium | Beta 트래픽이 늘어나는 시점 | 미착수 — `docs/ops/monitoring.md` "Prometheus/Grafana: 미도입" |
| Alert 채널·에스컬레이션 정책 수립(누가/어떻게 알림받을지 — Slack/이메일/전화 등 운영 판단) | High | Beta 배포 직전 | 미착수 — `docs/ops/monitoring.md` "Alert: 현재 상태 없음", 대상 서비스 자체가 없어 Alert 정의 불가 상태 |
| `GET /v1/status`를 외부 Uptime 모니터(UptimeRobot 등)에 연결 | Medium | Beta 배포 직후(비용 대비 가장 낮음, `docs/ops/monitoring.md` "Next Milestone") | 미착수 |
| DB 커넥션 풀 고갈(`pool.ts` max 10) 등 인프라 임계치 모니터링 체계 구축 | Low | `V_1.0.0` 이전 | 미착수 — `docs/ops/monitoring.md` Alert 우선순위 4번 항목 |

## QA

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| 실기기 테스트(Android/iOS 실물 폰) | High | Beta 배포 전 | 미완료 — 자동화 환경(이 세션 포함)은 실기기 접근이 없어 검증 불가(Frontend Schema Verification Report §7·§9) |
| 태블릿 실기기 테스트(제품의 실제 타겟 폼팩터 — "AOD Tablet") | Critical | Beta 배포 전 | 미완료 — 제품명이 "AOD Tablet"임에도 실 태블릿 기기 검증 기록이 두 저장소 어디에도 없음 |
| 회귀 테스트(자동화된 regression suite 구축 및 정기 실행) | High | 지속적 — Beta 배포 이후에도 매 릴리즈마다 | 미착수 — `docs/workflow.md` 출시 전 체크리스트 "Testing" 카테고리 전체가 Not Started(Backend 자동 테스트, Flutter Widget Test, Integration Test 포함) |

## Design

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| 앱 아이콘 최종 확정(현재 `android/app/src/main/res/mipmap-*`가 Flutter 기본 템플릿 아이콘인지 실제 브랜드 아이콘인지 확인) | Medium | Beta 배포 전 | 확인 필요 — 파일은 존재하나 내용(기본 템플릿 vs 브랜드 디자인)은 이미지이므로 사람이 직접 확인해야 함 |
| 스토어 등록용 스크린샷 제작 | Medium | 스토어 등록 시점(`V_1.0.0` 근접) | 미착수 |
| 스토어 프로모션 이미지(Feature Graphic 등) 제작 | Low | 스토어 등록 시점 | 미착수 |

## Business

| 작업 내용 | 우선순위 | 권장 수행 시점 | 완료 여부 |
|---|---|---|---|
| **BYOK vs Platform-funded 과금 주체 결정**(LLM 토큰 비용을 사용자가 부담할지 플랫폼이 부담할지, 또는 하이브리드) | Critical | AI Platform 구현 착수 전 | 미결 — 이 결정이 위 External Service의 OpenAI/Gemini 계정 필요 여부를 좌우한다. 계약상으로는 두 Source 모두 지원 가능하게 정의되어 있고(`byok` 우선 → `platform` 폴백, [requirements/domain_icd/llm.md](../requirements/domain_icd/llm.md) §CredentialSource), **BYOK는 어느 경우에도 제거되지 않는다** — 결정 대상은 "platform Source를 실제로 켤 것인가"다 |
| 가격 정책 검토 | Medium | `V_0.1.2`~`V_0.5.0` 사이(PMF 검증 이후) | 미착수 — **의도된 보류**, 결함 아님. `docs/docs/roadmap/kpi.md`: "수익보다 PMF가 우선이다" — 현재 Primary KPI는 매출이 아니라 Daily Action Count |
| Beta 사용자 모집 | High | Beta 배포 직후 | 미착수 |
| 피드백 수집 계획(채널, 설문, 분석 파이프라인) 수립 | High | Beta 배포와 동시 | 미착수 — 현재 `AnalyticsModule`은 로컬 카운터 수준으로, KPI 계측 파이프라인이 아님(`docs/docs/roadmap/kpi.md` "근거") |

---

## 카테고리별 항목 수

| 카테고리 | Critical | High | Medium | Low | 합계 |
|---|---|---|---|---|---|
| Release | 2 | 0 | 0 | 0 | 2 |
| Legal | 3 | 1 | 3 | 0 | 7 |
| Cloud | 2 | 3 | 0 | 0 | 5 |
| OAuth | 3 | 0 | 0 | 0 | 3 |
| External Service | 1 | 4 | 0 | 1 | 6 |
| Security | 1 | 1 | 1 | 0 | 3 |
| Monitoring | 0 | 2 | 2 | 1 | 5 |
| QA | 1 | 2 | 0 | 0 | 3 |
| Design | 0 | 0 | 2 | 1 | 3 |
| Business | 1 | 2 | 1 | 0 | 4 |
| **합계** | **14** | **15** | **9** | **3** | **41** |

> 2026-08-02 기준 증감: AI Platform(LLM Gateway) 관련 6건 추가 —
> Legal +1(Critical), External Service +3(High), Cloud +1(High),
> Business +1(Critical). 이전 합계 35건 → 41건.

## 우선순위 요약

| 우선순위 | 항목 수 | 비고 |
|---|---|---|
| Critical | 14 | Play/App Store 등록 2건, Privacy/Terms 2건, **LLM 제3자 전송 법률 승인**, 서버·SSL 2건, OAuth Verification·Redirect URI·Credential 3건, Calendar 운영 설정, HTTPS/CORS 확정, 태블릿 실기기 테스트, **BYOK vs Platform-funded 과금 주체 결정** |
| High | 15 | BYOK 법률 조항, 배포 자동화·도메인, **LLM 검증용 Provider 키·OpenAI 계정·Gemini 접근 3건**, **LLM 비용 상한 설정**, OpenWeather 키, 보안 점검, 에러 트래킹·Alert 정책, 실기기·회귀 테스트, Beta 모집·피드백 계획 |
| Medium | 9 | Action 면책·미성년자·데이터 삭제 법률 검토 3건, Secret 관리, 메트릭 대시보드·Uptime 모니터, 앱 아이콘·스크린샷, 가격 정책 |
| Low | 3 | Home Assistant 실기기, DB 임계치 모니터링, 스토어 프로모션 이미지 |

**Critical 14건 중 8건이 Beta 공개 배포(불특정 다수 대상) 이전 필수** — 내부
테스트 트랙(제한된 테스트 사용자)만이라면 Google Play Console 등록,
서버/도메인/SSL, Redirect URI 등록만으로 시작 가능하고, Privacy
Policy/Terms/OAuth Verification/Store 등록은 공개 전환 시점까지 유예할
수 있다(Google Play의 내부 테스트 트랙과 OAuth 테스트 사용자 목록 정책
기준 — 각 플랫폼의 최신 정책은 사람이 직접 확인 필요).

**신규 Critical 2건은 Beta 배포가 아니라 AI Platform Phase 착수를 막는
Blocker다** — 배포 일정과 무관하게, 아래 두 건이 해소되기 전에는 Backend LLM
Gateway 구현 프롬프트를 실행할 수 없다:

| # | Blocker | 카테고리 | 왜 막히는가 |
|---|---|---|---|
| B1 | 사용자 대화 내용의 제3자 LLM Provider 전송 법률 승인 | Legal | 승인 전에는 실사용자 chat 내용이 백엔드를 거쳐 OpenAI/Google로 나갈 수 없다 |
| B2 | 검증용 실제 Provider API Key | External Service | Mock 검증은 성공으로 인정되지 않아([CLAUDE.md](../CLAUDE.md) Verification Report Rule) 구현을 "완료"로 보고할 수단이 없다 |

여기에 **BYOK vs Platform-funded 과금 주체 결정**(Business, Critical)이 선행되면
External Service의 OpenAI/Gemini 계정 3건 중 어떤 것이 실제로 필요한지가
확정된다 — 순수 BYOK를 택하면 플랫폼 계정 2건은 불필요해진다.

## 관련 문서

- [BETA_RELEASE_STATUS_REPORT.md](BETA_RELEASE_STATUS_REPORT.md) — 이 문서를 인용하는 종합 보고서
- [current_status.md](current_status.md) — Blocker/Known Issues(코드 수준)
- [../docs/workflow.md](../docs/workflow.md) — 출시 전 필수 체크리스트(Infrastructure/Database/Security/Testing/Reliability)
- [../docs/policies/privacy_policy.md](../docs/policies/privacy_policy.md), [../docs/policies/security_policy.md](../docs/policies/security_policy.md)
- [../docs/ops/monitoring.md](../docs/ops/monitoring.md) — Monitoring 카테고리 근거 원본
- [../backend/docs/deployment/README.md](../backend/docs/deployment/README.md)
- [../backend/docs/plugins/google-oauth.md](../backend/docs/plugins/google-oauth.md)
- [../docs/roadmap/kpi.md](../docs/roadmap/kpi.md)
