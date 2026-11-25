# Galaxy Expansion Protocol v1 — 참가자 계약 (고정)

이 문서는 [Galaxy-Expansion 플랫폼의 Protocol v1](https://github.com/SSAFY-16-GUMI-5/Galaxy-Expansion/blob/main/docs/PROTOCOL.md)을 참가자 관점에서 재정리한 **v1 고정 규격**입니다. 변경이 필요하면 운영자가 플랫폼과 스타터를 함께 버전업해야 합니다.

## 통신 경로

```text
참가자 프로그램 (임의 언어)
  ⇅ UTF-8 JSON Lines via stdin / stdout
Local Bridge (Node.js 22+)
  ⇅ WebSocket / WSS
Relay Server (검증, 상태, 세션 관리)
  ↓ read-only state broadcast
Three.js WebGL Viewer
```

참가자 프로그램은 네트워크 연결과 인증을 직접 구현하지 않습니다. Bridge가 관리합니다.

## 시작 및 응답

Bridge → 참가자 stdin:

```json
{"type":"init","participantId":"alice"}
```

Relay ack/error → Bridge → 참가자 stdin:

```json
{"type":"ack","action":"acquire","revision":42}
```

```json
{"type":"error","message":"Slot is already active"}
```

참가자 프로그램은 `init`을 받은 뒤 JSONL 이벤트를 출력해야 합니다. `ack`와 `error`는 선택적으로 처리하되, 서버의 처리 결과가 필요하다면 확인하십시오.

## Acquire (stdout 한 줄)

```json
{"type":"acquire","poolSlotId":"7","generation":1,"data":{"name":"Aurora","type":"star","color":"#5dcaff","size":1.2}}
```

필드:

| 필드 | 조건 |
| --- | --- |
| `type` | `acquire` |
| `poolSlotId` | 문자열 또는 안전한 정수, 문자·숫자·`_`·`-`, 길이 1~48 |
| `generation` | 양의 정수. 최초 1, 반환 후 동일 슬롯 재사용 시 이전 값 +1 |
| `data.name` | 공백만 있는 문자열 불가, 길이 1~40 |
| `data.type` | `seed`, `star`, `planet` |
| `data.color` | 6자리 HEX 색상 `#RRGGBB` |
| `data.size` | 유한한 숫자, 0.3~3.5 |

현재 v1은 타입에 관계없이 단순 3D 구체로 렌더링합니다.

## Release

```json
{"type":"release","poolSlotId":"7","generation":1}
```

사용 중인 슬롯의 현재 generation과 정확히 일치해야 합니다. 중복 Release나 오래된 generation은 서버가 거부합니다.

## Reset (선택)

```json
{"type":"reset"}
```

해당 참가자의 슬롯들을 초기화합니다. 초기화 후 같은 슬롯 ID를 새로 만들면 generation은 1부터 시작합니다.

## 필수 동작 예시

```jsonl
{"type":"acquire","poolSlotId":"7","generation":1,"data":{"name":"Aurora","type":"star","color":"#5dcaff","size":1.2}}
{"type":"release","poolSlotId":"7","generation":1}
{"type":"acquire","poolSlotId":"7","generation":2,"data":{"name":"Reborn Nova","type":"star","color":"#a78bfa","size":1.6}}
```

`participantId`는 인증된 Bridge 연결에서 서버가 부여합니다. 참가자 이벤트에 실어 보내더라도 서버에서는 해당 필드를 무시합니다.

## 크기 및 한도

- 한 JSON 메시지는 **8,000 UTF-8 바이트 이하**로 유지합니다(현재 Bridge의 출력 줄 제한).
- 서버 기준 WebSocket 메시지 최대 8 KiB, 연결당 초당 최대 90개.
- 참가자당 서로 다른 슬롯 최대 500개, 전체 활성 별 최대 1200개.
- 이벤트 순서에 의존하는 경우 ack를 확인하십시오. v1은 영속적 재전송 또는 exactly-once 전달을 보장하지 않습니다.

## 로컬 검증기의 범위

`scripts/verify-protocol.mjs`는 **한 참가자의 유한한 이벤트 시퀀스**만 검사합니다. 실제 WebSocket 연결, 인증, 네트워크 재접속, 다른 참가자와의 경쟁, 메모리의 실제 인스턴스 재사용은 검증하지 않습니다. 단순히 JSON을 올바르게 출력했다고 Object Pool 구현이 완성된 것은 아닙니다.
