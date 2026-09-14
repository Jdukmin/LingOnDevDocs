# Monitoring

> **Status**: Not Started · **Progress**: 0% · **Last Updated**: 2026-09-14 · **Next Milestone**: `GET /v1/status`를 외부 Uptime 모니터에 연결하는 것부터 시작(가장 비용이 낮음)

---

## Health Check

**이미 있음**: `GET /v1/status`(`backend/docs/api/status.md`) — 서버 이름 +
`requestId`만 반환하는 순수 liveness 체크. DB 커넥션 상태, 외부 Provider
가용성 등은 포함하지 않는다.

**제안 — 미수립**: `/v1/status`를 확장한 readiness 체크(DB 연결 확인 포함)
또는 별도 엔드포인트 추가 여부 결정.

## Sentry (에러 트래킹)

**현재 상태**: 미도입. `raw_logs`의 `unhandled_exception` 행이 유일한
예외 기록 수단이다(`backend/docs/database/raw_logs.md`) — 실시간 알림,
스택 트레이스 그룹화, 발생 빈도 추적 기능은 없다.

## Prometheus / Grafana (메트릭)

**현재 상태**: 미도입. `request_logs` 테이블이 요청 단위 원시 데이터를
갖고 있지만, 이를 시계열 메트릭으로 집계/시각화하는 파이프라인은 없다.

**제안 대시보드(초안)**:
- 요청량/응답시간(P50/P95/P99) — `request_logs` 기반
- 5xx 비율 — Error Policy([../policies/error_policy.md](../policies/error_policy.md)) 기준 집계
- Rate limit(429) 발생 빈도
- Provider(Google/OpenWeather) 502 비율 — `raw_logs`의 `provider_http_error`/`provider_network_error` 기반

## Alert

**현재 상태**: 없음. 위 Health Check/Sentry/Prometheus가 전혀 없으므로
Alert를 정의할 대상 자체가 없다.

**제안 — 우선순위(구축 시)**:
1. 5xx 비율 급증
2. `GET /v1/status` 응답 실패(Health Check)
3. Refresh Token 정리 Job 실패(도입 시 — [../ops/data_sop.md](data_sop.md))
4. DB 커넥션 풀 고갈(`pool.ts`, max 10)

## Correlation ID(요청 추적 ID) 통합

**변경 사항**(lingon@b5fad88):
- `app.ts:124` `requestIdHeader: 'x-request-id'` — 인바운드 `x-request-id` 헤더를 Fastify가 요청 ID로 인식.
- `app.ts:125` `genReqId: () => randomUUID()` — 헤더가 없으면 UUID 생성(`randomUUID`는 `app.ts:10`에서 import).
- `RequestContext.ts:23` `requestId: String(req.id)` — Fastify의 `req.id`를 그대로 재사용(별도 ID를 새로 만들지 않음).

세 로그 싱크가 이제 하나의 ID를 공유한다:

| 싱크 | 필드 | 기록 위치 |
|---|---|---|
| Pino(stdout/file) | `reqId` | Fastify 자체 요청 로거 |
| `request_logs` | `req_id` | `RequestLog.ts:31` (`reqId: req.ctx.requestId`) |
| `raw_logs` | `reqId` | `AppError.ts:82` (`reqId: req.ctx?.requestId ?? null`, nullable) |

기존에는 세 값이 서로 무관해 pino 로그를 `request_logs` 행과 조인할 방법이 없었다(타임스탬프+엔드포인트 추정 수준). 이제 동일 ID로 콘솔 로그·HTTP 요청 행·예외/Provider 오류 행을 하나의 요청으로 묶을 수 있다. 단 `raw_logs.reqId`는 요청 스코프가 없는 프로세스 레벨 이벤트(서버 라이프사이클 등)에서는 null.

위 Prometheus/Grafana 제안 대시보드와 Sentry 섹션은 `request_logs`/`raw_logs` 집계에 의존한다. 공통 상관 ID는 집계(5xx 급증, Provider 502 비율)에서 개별 요청의 전체 로그로 drill-down하기 위한 전제 조건이 **이제 갖춰졌다** — 대시보드·알림 구축 자체는 여전히 미착수.

## 관련 문서

- [../policies/error_policy.md](../policies/error_policy.md) — 503/5xx 정책
- [../policies/logging_policy.md](../policies/logging_policy.md) — 로그 필드/리다크션 정책
- [deployment_sop.md](deployment_sop.md) — 배포 후 상태 확인
- [../workflow.md](../workflow.md) — 출시 전 체크리스트 Infrastructure/Reliability 항목

---

# Change Log

- **2026-07-22** — 최초 작성(전 항목 미도입 상태를 그대로 기록). Docs Revision(SSOT 정리) 작업의 일부.
- **2026-09-14** — Correlation ID 통합 섹션 추가: `app.ts`/`RequestContext.ts` 변경으로 pino `reqId`·`request_logs.req_id`·`raw_logs.reqId`가 동일 값을 공유하게 됨(lingon@b5fad88). 모니터링 스택 자체는 여전히 미도입(Status/Progress 변경 없음).
