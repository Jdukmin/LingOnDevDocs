# Privacy & Legal Requirements

> **Status**: Not Started(전부 미착수) · **Progress**: 0% · **Last Updated**: 2026-07-22 · **Next Milestone**: 법률 검토(변호사/법무) 착수 — 이 문서는 요구사항 정리이지 실제 정책 문서가 아니다

이 문서는 **실제 Privacy Policy/Terms 텍스트가 아니다** — 어떤 내용이
왜 필요한지 정리한 "요구사항" 문서다. 실제 법적 문서는 법률 검토를 거쳐야
하며 이 저장소의 범위를 벗어난다.

---

## Privacy Policy 요구사항

| 항목 | 이유 |
|---|---|
| 수집하는 개인정보 목록 | 이메일, 프로필 이미지, 닉네임(Google OAuth) — `database/users.md` |
| Google Calendar 데이터 접근 사실 고지 | `calendar.readonly` 스코프로 일정 제목/시간/장소를 읽음 — `backend/docs/api/calendar.md` |
| 향후 Home Assistant/NAS 접근 고지 | 가정 내부망·기기 상태까지 접근 범위가 확장됨 — [homeassistant.md](../../requirements/domain_icd/homeassistant.md), [nas.md](../../requirements/domain_icd/nas.md) |
| BYOK API 키 저장 고지 | 사용자가 등록한 LLM Provider 키를 암호화 저장함(`user_api_keys`) |
| 제3자 제공 여부 | OpenAI 등 LLM Provider에 대화 내용이 전달됨(`frontend/docs/services/LlmService.md`) — 고지 필요 |
| 데이터 보관 기간 | 아래 "보관 정책" 참고 |
| 사용자 권리(열람/정정/삭제) | 아래 "삭제 정책" 참고 |

## Terms 요구사항

| 항목 | 이유 |
|---|---|
| BYOK 책임 소재 | 사용자가 자신의 LLM Provider 키 사용량/비용을 직접 부담함을 명시 |
| Action 실행 면책 | Home Assistant 기기 제어, NAS 백업 등 실제 부작용이 있는 Action의 오작동에 대한 책임 범위 |
| 서비스 가용성 | SLA 없음(MVP 단계) 명시 |
| 미성년자 이용 제한 여부 | 검토 필요 |

## Google OAuth Scope

| Scope | 용도 | 문서 |
|---|---|---|
| `openid email profile` | 로그인 | `backend/docs/plugins/google-oauth.md` |
| `calendar.readonly` | 일정 조회(읽기 전용 — 쓰기 권한 없음) | 동일 |

**Google 보안 심사(OAuth Verification)**: `calendar.readonly`는 Google이
"민감한 범위(Sensitive Scope)"로 분류하는 스코프다 — 테스트 사용자 목록을
벗어나 일반 공개하려면 Google의 앱 심사(OAuth consent screen verification,
필요 시 보안 평가)를 통과해야 한다. **현재 미착수.**

## 사용자 데이터 삭제 정책 (요구사항 — 미구현)

| 데이터 | 삭제 방법(제안) |
|---|---|
| 계정 자체 | `userRepository.deleteUser(id)`는 이미 존재(`database/users.md` Queries) — 그러나 이를 호출하는 "계정 삭제" API/화면은 없음 |
| Google Calendar 토큰 | 계정 삭제 시 함께 삭제(암호화 컬럼이므로 행 삭제로 충분) |
| Refresh Token | 계정 삭제 시 `revokeAllForUser` 호출 |
| Action/Workflow 실행 이력(향후) | 보관 기간 이후 자동 삭제 또는 사용자 요청 시 삭제 — [action_layer_api.md](../icd/action_layer_api.md) 구현 시 함께 설계 필요 |
| `request_logs`/`raw_logs` | 개인 식별 가능한 `userId`를 포함 — 삭제/익명화 정책 없음 |

## 사용자 데이터 보관 정책 (요구사항 — 미구현)

| 데이터 | 현재 상태 | 필요한 정책 |
|---|---|---|
| `refresh_tokens`(만료 행) | 자동 삭제 안 됨(`database/refresh_tokens.md`) | TTL 기반 정리 Job — [../ops/data_sop.md](../ops/data_sop.md) |
| `request_logs`/`raw_logs` | 보관 기간 정책 없음 | 예: 90일 이후 자동 삭제/집계로 전환 |
| Google Calendar 토큰 | 연결 해제 시 삭제 여부 미문서화 | 연결 해제(disconnect) 플로우 자체가 아직 없음 — Tool Domain 구현 시 함께 정의 |

## 관련 문서

- [security_policy.md](security_policy.md) — 암호화/저장 방식
- [../workflow.md](../workflow.md) — 출시 전 체크리스트 Security 항목(Privacy Policy/Terms/Google Verification)
- [../../requirements/domain_icd/user.md](../../requirements/domain_icd/user.md) — User Domain의 Permission 개념

---

# Change Log

- **2026-07-22** — 최초 작성(요구사항 정리, 실제 정책 문서 아님). Docs Revision(SSOT 정리) 작업의 일부.
