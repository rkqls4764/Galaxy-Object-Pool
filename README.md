# Galaxy Expansion Starter

> SSAFY 16기 구미 5반 · PROJECT 01 · Object Pooling

**원하는 언어로 객체 풀을 설계하고, 재사용한 객체를 별로 표현하는 미니 프로젝트**입니다. 참가자가 AI와 설계·테스트를 의논하고, 핵심 풀링 로직을 직접 작성하며 동작을 검증합니다.

- [공동 WebGL 플랫폼](https://ssafy-16-gumi-5.github.io/Galaxy-Expansion/)
- [플랫폼 소스](https://github.com/SSAFY-16-GUMI-5/Galaxy-Expansion)
- [과제 명세](docs/ASSIGNMENT.md) · [프로토콜 v1](docs/PROTOCOL.md) · [AI 개발 절차](docs/AI_WORKFLOW.md) · [언어별 시작 가이드](docs/LANGUAGE_GUIDE.md)

## 1. 시작하기

1. 이 저장소에서 **Use this template → Create a new repository**를 선택합니다. `Fork`가 아니라 자신의 독립적인 저장소를 만듭니다.
2. 본인 저장소를 Clone하고 VS Code / IDE / AI 코딩 도구로 엽니다.
3. 저장소를 읽고 편집할 수 있는 AI 코딩 도구에 **“뭐 해야 해?”**라고 물어보세요. 원하는 언어가 있다면 함께 알려 주세요.
4. AI가 만든 `solution/`의 실행 진입점을 실행해 보고, 안내받은 첫 파일과 TODO를 엽니다.
5. AI와 **설계 → 작은 구현 단계 → 테스트 → 리뷰**를 반복합니다. 핵심 풀링 로직은 직접 작성합니다.

### AI가 저장소 지침을 불러오지 않을 때 사용할 상세 프롬프트

```text
이 저장소는 Galaxy Expansion의 참가자용 스타터 템플릿입니다.
먼저 README.md, AGENTS.md, docs/ASSIGNMENT.md, docs/PROTOCOL.md,
docs/AI_WORKFLOW.md를 읽고 요구사항과 검증 기준을 파악하십시오.

1. 제가 사용할 언어를 아직 말하지 않았다면 먼저 물어보십시오.
2. 언어가 정해지면 solution/에 main 함수(또는 해당 언어의 실행 진입점),
   JSONL 연결 코드, 필요한 빌드 설정을 작성하십시오. 데이터 모델과
   Acquire/Release의 시그니처 및 TODO가 있는 시작 파일도 만드십시오.
   빌드와 시작 실행을 확인하고, 실행 명령과 제가 먼저 열 파일·TODO를 알려 주십시오.
3. 동일 인스턴스 재사용, 재획득 시 초기화, 중복 반환 후 풀 상태의
   입력과 기대 결과를 함께 정하고 실행 가능한 단위 테스트를 같이 작성하십시오.
4. 핵심 풀링 로직을 제가 직접 작성할 수 있도록 설계 선택지와 장단점을 설명하십시오.
   구현 단계는 함께 정하고, 막히면 질문·힌트·의사코드나 짧은 코드 예시로 도와주십시오.
   제가 쓴 구현을 리뷰하고, 테스트 결과를 보며 다음 단계를 같이 정하십시오.
5. 기존 docs/PROTOCOL.md와 contracts/ 및 scripts/의 검증 규칙을
   임의 변경하거나 테스트를 우회하지 마십시오.
6. .github/workflows/solution-<lang>.yml에서 PR마다 필요한 빌드,
   언어별 단위 테스트, node scripts/verify-protocol.mjs -- <실행 명령>을
   실행하십시오. 중계 서버나 토큰은 필요하지 않습니다.
7. solution/README.md에 로컬 검증 명령을 기록하고, 결과를
   통과, 실패(구현 TODO 포함), 미실행으로 구분해 보고하십시오.
```

**AI 활용 원칙.** 참가자가 구현을 주도하고, AI는 선택지 설명, 작은 예시, 테스트 작성과 코드 리뷰를 돕습니다. 참가자는 `Acquire`/`Release`의 설계 이유와 실제 재사용을 입증한 테스트를 설명할 수 있어야 합니다.

## 2. 공통 계약 테스트

Node.js **22 이상**이 필요합니다. 이는 언어별 프로젝트의 런타임이 아니라 **공통 검증기 실행 환경**입니다.

```bash
node --version
npm test
npm run verify:fixture
```

- `npm test`: 메시지 검증기 자체를 검사합니다.
- `npm run verify:fixture`: 올바른 JSONL 이벤트 예제가 현재 프로토콜에 맞는지 검사합니다.
- **이 두 명령은 참가자 Object Pool 구현의 완성 여부를 검증하지 않습니다.**

AI가 만든 실행 프로젝트의 통신 테스트는 아래처럼 실행하십시오(언어에 맞춰 변경).

```bash
node scripts/verify-protocol.mjs -- python solution/main.py
# 또는
node scripts/verify-protocol.mjs -- java -cp solution/out Main
# 또는
node scripts/verify-protocol.mjs -- ./solution/build/galaxy
```

`--` 뒤에는 **빌드된 실행 프로그램을 실행하는 명령**을 입력합니다. 자동으로 모든 언어를 컴파일해 주지는 않습니다. 검증기는 자식 프로세스에 `init` 메시지를 보내고, JSONL stdout의 `acquire`/`release`/`reset`을 검사하며 `ack`를 반환합니다. 종료 시에는 최소 1회 이상의 **반환 후 재사용 사이클**을 확인합니다. 자세한 검증 범위는 [과제 명세](docs/ASSIGNMENT.md)를 참고하십시오.

## 3. 첫 번째 구현 목표

`CosmicObject`는 이름, 타입, 색상, 크기를 가집니다.

- `Acquire(...)`: 사용 가능한 기존 객체를 우선 재사용하거나, 필요하다면 새로운 슬롯을 확보합니다.
- `Release(object)`: 객체를 비활성화하고 풀에 반환합니다.
- 재사용 시 **같은 풀 슬롯 식별자**를 유지하고 `generation`을 1 증가시킵니다.
- 내부에서 실제 **동일 인스턴스/저장 공간**을 재사용했는지는 해당 언어의 단위 테스트로 입증합니다.
- `name` 1~40자, `type`: `seed`/`star`/`planet`, `color`: `#RRGGBB`, `size`: `0.3`~`3.5`를 준수합니다.

```json
{"type":"acquire","poolSlotId":"7","generation":1,"data":{"name":"Aurora","type":"star","color":"#5dcaff","size":1.2}}
```

**중요:** `stdout`은 한 줄에 JSON 하나만 출력합니다. 디버그 로그는 반드시 `stderr`로 보냅니다. `participantId`는 브리지가 인증 정보를 바탕으로 서버에 부여하므로 출력 메시지에 넣지 않습니다.

## 4. 로컬 웹 시각화 연동

현재 GitHub Pages의 공개 화면은 **정적 웹 프론트엔드**입니다. 참가자의 로컬 객체를 전송하려면 [Galaxy-Expansion 플랫폼](https://github.com/SSAFY-16-GUMI-5/Galaxy-Expansion)의 Local Bridge와 WebSocket Relay가 필요합니다.

Windows PowerShell에서 플랫폼 저장소를 별도로 Clone한 뒤:

```powershell
# 터미널 A: 웹 화면
cd Galaxy-Expansion
npm run dev

# 터미널 B: Relay (최초 1회 npm install 필요)
cd Galaxy-Expansion
npm install
npm run relay

# 터미널 C: 참가자 프로그램 (예시: Python)
cd Galaxy-Expansion
$env:GALAXY_PARTICIPANT_ID = "my_unique_id"
$env:GALAXY_TOKEN = "local-demo-token"
node bridge/local-bridge.mjs -- python ../Galaxy-Expansion-Starter/solution/main.py
```

브라우저에서 `http://localhost:4173`을 열고 `ws://127.0.0.1:8787/ws`로 CONNECT하면 로컬 연동을 시험할 수 있습니다. 위 경로는 **두 저장소를 같은 상위 폴더에 Clone한 경우**의 예시입니다.

> **주의:** HTTPS로 제공되는 GitHub Pages에서는 로컬 개발용 `ws://` 연결을 사용할 수 없습니다. 공개 사이트와 외부 참가자를 연동하려면 별도 서버에서 유효한 TLS를 사용하는 `wss://` 엔드포인트가 필요합니다. 로컬 토큰은 인터넷 서버에 사용하지 마십시오.

## 5. 제출 및 발표

- 참가자의 `solution/` 코드와 실행 방법
- `Acquire`/`Release`의 설계 선택 및 메모리 재사용을 입증한 테스트
- JSONL 프로토콜 검증 결과
- 학습 기록: 선택한 자료구조, 고려한 대안, 어려웠던 점, 개선 아이디어
- 가능하면 WebGL 화면에서 자신의 별을 시연

> **저장소 운영자:** 이 저장소를 GitHub `Settings → General → Template repository`로 설정하십시오. 템플릿에서 만든 참가자 저장소는 추후 원본 수정 사항을 자동으로 동기화하지 않습니다. 프로토콜 버전과 변경 이력을 관리하십시오.
