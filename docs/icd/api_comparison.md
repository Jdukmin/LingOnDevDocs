# API Comparison — 기존 vs Action Layer 제안

> **Status**: Proposed (미구현) · **Progress**: 0% · **Last Updated**: 2026-07-21 · **Next Milestone**: 이 표 기준으로 `GET /v1/actions/types`에 Calendar/Weather Wrap 항목 등록

기존 API는 **하나도 삭제·변경하지 않는다.** 이 표는 각 기존 API가 Action Layer
도입 이후 어떻게 되는지를 분류한다. 분류는 4가지뿐이다: **Keep**(그대로 유지,
Action Layer와 무관) / **Wrap**(그대로 유지 + Action Type으로 추가 노출) /
**Add**(신규) / **Deprecated**(대체 예정 — 즉시 제거 아님).

---

## Backend API

| 기존 API | 문서 | 분류 | 비고 |
|---|---|---|---|
| `GET /v1/status` | [backend/docs/api/status.md](../../backend/docs/api/status.md) | Keep | Action Layer와 무관한 헬스체크 |
| `POST/GET /v1/auth/*` | [backend/docs/api/auth.md](../../backend/docs/api/auth.md) | Keep | Action Layer의 인증 기반 그대로 사용 |
| `GET /v1/calendar/events` | [backend/docs/api/calendar.md](../../backend/docs/api/calendar.md) | **Wrap** | `calendar.list_events` Action Type으로 노출 |
| `GET /v1/weather/current`, `/forecast5`, `/geo/*` | [backend/docs/api/weather.md](../../backend/docs/api/weather.md) | **Wrap** | `weather.get_current`, `weather.get_forecast` Action Type으로 노출 |
| `GET/PUT /v1/settings/ai`, `/ui` | [backend/docs/api/settings.md](../../backend/docs/api/settings.md) | Keep | Action Layer와 무관, 사용자 설정 그대로 |
| `GET/PUT/DELETE /v1/apikey/:provider` | [backend/docs/api/apikey.md](../../backend/docs/api/apikey.md) | Keep | LLM Gateway(SYS-010)의 provider 키 저장소로 계속 사용 |
| `GET/PATCH /v1/users/me` | [backend/docs/api/users.md](../../backend/docs/api/users.md) | Keep | 변경 없음 |
| *(없음)* | — | **Add** | `POST /v1/actions/execute`, `GET /v1/actions/:id`, `GET /v1/actions/:id/stream`, `GET /v1/actions/history`, `GET /v1/actions/suggestions`, `GET /v1/actions/types` — [action_layer_api.md](action_layer_api.md) |
| *(없음)* | — | **Add** | `POST /v1/workflow`, `GET /v1/workflow`, `GET /v1/workflow/:id`, `POST /v1/workflow/:id/execute`, `POST /v1/workflow/execute`, `GET /v1/workflow/executions/:id` — [action_layer_api.md](action_layer_api.md) |

## Frontend

| 기존 구조 | 문서 | 분류 | 비고 |
|---|---|---|---|
| `AodDisplay`를 앱의 유일한 메인 화면으로 사용 | [frontend/docs/ui/AodDisplay.md](../../frontend/docs/ui/AodDisplay.md) | **변경 제안** (Deprecated 아님) | Dashboard는 유지하되 진입 순서를 마지막으로 이동 — [frontend_interaction_flow.md](frontend_interaction_flow.md) |
| `LlmGateway`/`OpenAiGateway` 클라이언트 직접 호출 | [frontend/docs/services/LlmService.md](../../frontend/docs/services/LlmService.md) | **Deprecated (대체 예정)** | Action Layer의 `llm.chat_complete` Action(백엔드 LLM Gateway, SYS-010)으로 대체 예정. 지금 당장 코드 변경 없음 — 문서에 배너만 추가함 |
| `CalendarModule`이 로컬 캘린더만 표시(백엔드 미호출) | [frontend/docs/widgets/CalendarWidget.md](../../frontend/docs/widgets/CalendarWidget.md) | **변경 제안** | Action Layer 도입 시 `calendar.list_events` Action 호출로 전환 검토 — [requirements/connector_requirements.md](../../requirements/connector_requirements.md) CON-001과 동일 이슈 |
| *(없음)* | — | **Add** | `ActionModule`, `ActionHistoryModule`, `SuggestionModule` — [action_layer_api.md](action_layer_api.md) State 섹션 |
| *(없음)* | — | **Add** | Intent Parsing 확인 카드, Action Result 카드, History 화면 — [frontend_interaction_flow.md](frontend_interaction_flow.md) |

---

## 결론

기존 API 중 **Deprecated로 표시한 것은 1건**(`LlmGateway`/`OpenAiGateway`
클라이언트 직접 호출)뿐이다. 나머지 기존 backend API는 전부 **Keep** 또는
**Wrap**이다 — Action Layer는 기존 API를 대체하는 것이 아니라 그 위에
얹히는 새 진입점이다.

## 관련 문서

- [README.md](README.md), [action_layer_api.md](action_layer_api.md), [gap_analysis.md](gap_analysis.md)

---

# Change Log

- **2026-07-21** — Action Layer 전략에 따라 신규 작성(Created according to Action Layer Strategy).
