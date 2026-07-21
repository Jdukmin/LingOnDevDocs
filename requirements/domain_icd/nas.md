# NAS Domain

> **Status**: Proposed · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Owner**: Integrations/Infrastructure · **Version**: 0.1.0-draft

비즈니스 계약만 정의한다. Tool Domain의 구체적 사례([tool.md](tool.md))다.
`backend/docs`, `frontend/docs` 어디에도 대응 구현이 없다 —
[requirements/connector_requirements.md](../connector_requirements.md) CON-004.

---

# Purpose

NAS Domain은 사용자의 개인 인프라(파일 저장소, 백업, 서버 상태)를 Action
Layer가 조회/제어할 수 있게 한다. [docs/strategy/positioning.md](../../docs/strategy/positioning.md)의
"Infrastructure" 영역을 담당하며, "퇴근 모드" Workflow의 백업 단계 같은
사례의 기반이 된다.

# Domain Model

| Entity | 설명 |
|---|---|
| **StorageVolume** | NAS의 저장 공간 단위(용량/사용량). |
| **BackupJob** | 정의된 백업 작업(대상, 스케줄, 마지막 실행 결과). |
| **HealthStatus** | NAS/서버의 종합 상태(CPU, Memory, Storage, 서비스 가동 여부를 종합). |
| **ServiceStatus(NAS)** | NAS에서 구동 중인 개별 서비스(예: Docker 컨테이너, Plex 등)의 상태. |

# Responsibilities

**한다**
- `StorageVolume`(CPU/Memory/Storage 포함 — Domain Model 참고)의 현재 상태를
  조회해 정규화한다.
- `BackupJob`의 실행을 트리거하고 결과를 조회한다.
- `HealthStatus`를 종합 판단 가능한 형태로 제공한다(임계치 판단 자체는
  Action/Notification Domain에서 처리 — 이 Domain은 원시 지표만 제공).
- `ServiceStatus`(개별 서비스 가동 여부)를 조회한다.

**하지 않는다**
- 백업 정책(보관 기간, 우선순위)을 결정하지 않는다 — 사용자/Workflow가
  정의한 정책을 실행할 뿐이다.
- 임계치 초과 시 알림 여부를 스스로 판단하지 않는다 — Notification Domain에
  위임한다.
- UI(그래프, 대시보드 카드)를 그리지 않는다.

# State

| State | 의미 |
|---|---|
| `Unknown` | 아직 상태를 조회하지 않음 |
| `Healthy` | 모든 지표가 정상 범위 |
| `Degraded` | 일부 지표가 경고 수준(예: Storage 90% 이상) |
| `Unreachable` | NAS/서버에 접근할 수 없음 |

`BackupJob`은 Action Domain의 Execution State([action.md](action.md))를 따른다
(`Pending/Running/Success/Failed`).

# Events

| Event | 발생 시점 | 소비자 |
|---|---|---|
| `HealthDegraded` | 지표가 경고 임계치를 넘음 | Notification Domain |
| `NasUnreachable` | 연결 실패 | Notification Domain, Tool Domain(`ToolConnection` 갱신) |
| `BackupJobCompleted` / `Failed` | 백업 작업 종료 | History, Notification |

# Inputs

- Action Domain의 `nas.get_status`, `nas.run_backup` 등 실행 요청
- NAS/서버 접근 정보(주소, 인증 — Tool Domain의 `ToolConnection`)

# Outputs

- 정규화된 `HealthStatus`/`StorageVolume`/`ServiceStatus`
- `BackupJob` 실행 결과

# Relationships

```
Action → Tool → NAS Domain → NAS/서버
```

- **Tool Domain**: NAS는 Tool의 한 구현 사례([tool.md](tool.md)).
- **Workflow Domain**: "퇴근 모드"의 백업 단계 등에서 참조([workflow.md](workflow.md)).
- **Notification Domain**: `HealthDegraded`/`NasUnreachable` 알림 발행원.

# Future Extensions

- 범용 "Server Monitoring"으로의 일반화 여부 검토 — 현재 Domain Model(CPU/Memory/Storage/Health/Service)이
  NAS 전용이 아니라 일반 서버에도 적용 가능한 지표라, 향후 별도 Server
  Domain을 만들지 이 Domain을 일반화할지는 [gap_analysis](../../docs/icd/gap_analysis.md) 및
  이 문서의 상위 분석(도메인 비교) 결과를 따른다.
- Prometheus 등 모니터링 도구 연동([tool.md](tool.md) 예시 참고)

# References

- Backend: (구현 없음)
- Frontend: (구현 없음)
- Strategy: [docs/strategy/positioning.md](../../docs/strategy/positioning.md), [docs/roadmap/mvp.md](../../docs/roadmap/mvp.md) (Tier 3)
- Requirement: [requirements/connector_requirements.md](../connector_requirements.md) CON-004
