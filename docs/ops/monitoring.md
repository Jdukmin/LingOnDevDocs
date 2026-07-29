# Monitoring

> **Status**: Not Started · **Progress**: 0% · **Last Updated**: 2026-07-22 · **Next Milestone**: `GET /v1/status`를 외부 Uptime 모니터에 연결하는 것부터 시작(가장 비용이 낮음)

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

## 관련 문서

- [../policies/error_policy.md](../policies/error_policy.md) — 503/5xx 정책
- [deployment_sop.md](deployment_sop.md) — 배포 후 상태 확인
- [../workflow.md](../workflow.md) — 출시 전 체크리스트 Infrastructure/Reliability 항목

---

# Change Log

- **2026-07-22** — 최초 작성(전 항목 미도입 상태를 그대로 기록). Docs Revision(SSOT 정리) 작업의 일부.
