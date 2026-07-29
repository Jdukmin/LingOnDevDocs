# Chat Layer Requirements

Parent Feature: [SYS-002 Natural Language Interaction](system_requirements.md). 구현
세부는 [frontend/docs/widgets/ChatWidget.md](../frontend/docs/widgets/ChatWidget.md),
[frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md)를 참조한다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| CHAT-001 | SYS-002 | Chat Interface | User shall be able to send free-form text messages and view AI responses as chat bubbles with a typing indicator. | Demo | In Progress | 25% |
| CHAT-002 | SYS-002 | Streaming Response | AI responses shall be rendered incrementally (token-by-token) as they are generated. | Test | Planned | 0% |
| CHAT-003 | SYS-002 | Voice Input | User shall be able to dictate a chat message via voice input. | Demo | Planned | 0% |
| CHAT-004 | SYS-002 | Context Awareness | Chat shall include prior messages in the current session as context for the next AI response. | Review | In Progress | 25% |
| CHAT-005 | SYS-002 | Markdown Rendering | AI chat responses shall render Markdown formatting (bold, lists, code blocks, links). | Demo | Planned | 0% |

---

## 근거 노트 (Evidence)

- **CHAT-001**: `ChatWidget` + `ChatModule` + `OpenAiGateway`가 실제로 동작하지만,
  LingOn 백엔드를 거치지 않고 Flutter 클라이언트가 OpenAI API를 직접 호출한다
  (`--dart-define=OPENAI_API_KEY`). Architecture가 정의한 Chat → Intent → ... 백엔드
  경로가 아니므로 "한쪽만 구현"(클라이언트 전용 임시 경로)으로 판단해 25%.
  근거: [frontend/docs/widgets/ChatWidget.md](../frontend/docs/widgets/ChatWidget.md),
  [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md).
- **CHAT-002**: `LlmGateway.stream()`이 추상 메서드로 선언만 되어 있고 "(미구현)"으로
  명시됨. `frontend/docs/FeatureList.md` 예정 기능에도 "AI 스트리밍 응답 — High,
  stream() 이미 선언됨"으로 남아 있어 실질 구현은 0%.
- **CHAT-003**: 음성 입력에 대한 코드·문서 근거가 전혀 없음.
- **CHAT-004**: `ChatModule`이 `List<ChatMessage>`를 매 요청마다 `complete()`에
  전달하므로 세션 내 대화 맥락은 유지되지만, 이는 Memory Layer(RAG)나 서버측
  세션 저장이 아닌 클라이언트 메모리상의 목록 전달일 뿐이라 25%.
  근거: [frontend/docs/services/LlmService.md](../frontend/docs/services/LlmService.md).
- **CHAT-005**: `ChatWidget` 문서에 "버블 형태로 표시"라고만 되어 있고 Markdown
  파서/렌더러에 대한 언급이 없음.
