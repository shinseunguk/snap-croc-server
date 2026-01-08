import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('문서')
@Controller('docs')
export class DocsController {
  @Get('websocket')
  @ApiOperation({ summary: 'WebSocket API 문서' })
  @ApiResponse({ status: 200, description: 'WebSocket API 문서 HTML' })
  getWebSocketDocs(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket API 문서 - Snap & Croc</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1, h2, h3 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h1 {
            background: linear-gradient(135deg, #3498db, #2c3e50);
            color: white;
            padding: 20px;
            margin: -30px -30px 30px -30px;
            border-radius: 10px 10px 0 0;
        }
        .endpoint {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
        }
        .event {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #27ae60;
        }
        .client-event {
            background: #fef9e7;
            border-left: 4px solid #f39c12;
        }
        .server-event {
            background: #eaf2ff;
            border-left: 4px solid #8e44ad;
        }
        code {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            display: block;
            white-space: pre-wrap;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        .inline-code {
            background: #e74c3c;
            color: white;
            padding: 2px 5px;
            border-radius: 3px;
            display: inline;
        }
        .badge {
            background: #3498db;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .nav {
            background: #34495e;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .nav a {
            color: white;
            text-decoration: none;
            margin-right: 15px;
            padding: 5px 10px;
            border-radius: 3px;
            transition: background 0.3s;
        }
        .nav a:hover {
            background: #3498db;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #3498db;
            color: white;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐊 WebSocket API 문서 - Snap & Croc</h1>
        
        <div class="nav">
            <a href="#connection">연결 설정</a>
            <a href="#client-events">클라이언트 이벤트</a>
            <a href="#server-events">서버 이벤트</a>
            <a href="#examples">사용 예시</a>
            <a href="#errors">에러 처리</a>
        </div>

        <div class="info">
            <strong>📡 실시간 통신:</strong> 이 문서는 Snap & Croc 게임의 WebSocket API 사용법을 설명합니다.
            방 관리, 실시간 게임 상태 동기화, 플레이어 상호작용을 다룹니다.
        </div>
        
        <div class="warning">
            <strong>🔄 API 통합 안내:</strong> 다음 기능들은 WebSocket으로 이관되었습니다:
            <ul>
                <li>준비 상태 변경 → <code>ready_toggle</code> 이벤트</li>
                <li>방 나가기 → <code>leave_room</code> 이벤트</li>
                <li>사용자 강퇴 → <code>kick_member</code> 이벤트</li>
            </ul>
            REST API는 편의상 3개만 유지: 방 생성, 코드 입장, 방 정보 조회
        </div>

        <h2 id="connection">🔗 연결 설정</h2>
        
        <div class="endpoint">
            <strong>네임스페이스:</strong> <span class="inline-code">/rooms</span><br>
            <strong>URL:</strong> <span class="inline-code">ws://localhost:3000/rooms</span>
        </div>

        <h3>인증 방법</h3>
        <code>import io from 'socket.io-client';

// 방법 1: auth 객체 사용 (권장)
const socket = io('http://localhost:3000/rooms', {
  auth: {
    token: 'your-jwt-token'
  }
});

// 방법 2: Query Parameter
const socket = io('http://localhost:3000/rooms?token=your-jwt-token');

// 방법 3: Authorization 헤더
const socket = io('http://localhost:3000/rooms', {
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token'
  }
});</code>

        <h2 id="client-events">📤 클라이언트 → 서버 이벤트</h2>

        <div class="event client-event">
            <h3><span class="badge">EMIT</span> join_room</h3>
            <strong>설명:</strong> 방 코드로 방에 입장<br>
            <strong>데이터:</strong>
            <code>socket.emit('join_room', {
  roomCode: 'ABC123'
});</code>
        </div>

        <div class="event client-event">
            <h3><span class="badge">EMIT</span> leave_room</h3>
            <strong>설명:</strong> 현재 방에서 나가기<br>
            <strong>데이터:</strong>
            <code>socket.emit('leave_room', {
  roomId: 1
});</code>
        </div>

        <div class="event client-event">
            <h3><span class="badge">EMIT</span> ready_toggle</h3>
            <strong>설명:</strong> 게임 준비 상태 변경<br>
            <strong>데이터:</strong>
            <code>socket.emit('ready_toggle', {
  roomId: 1,
  isReady: true  // true: 준비, false: 준비 해제
});</code>
        </div>

        <div class="event client-event">
            <h3><span class="badge">EMIT</span> kick_member</h3>
            <strong>설명:</strong> 다른 사용자 강퇴 (방장만 가능)<br>
            <strong>데이터:</strong>
            <code>socket.emit('kick_member', {
  roomId: 1,
  targetUserId: 3  // 강퇴할 사용자 ID
});</code>
        </div>

        <h2 id="server-events">📥 서버 → 클라이언트 이벤트</h2>

        <div class="event server-event">
            <h3><span class="badge">ON</span> room_updated</h3>
            <strong>설명:</strong> 방 전체 정보 업데이트<br>
            <strong>데이터 구조:</strong>
            <code>socket.on('room_updated', (data) => {
  console.log(data);
  /*
  {
    roomId: 1,
    currentMembers: 3,
    maxMembers: 8,
    status: "waiting",
    members: [
      {
        id: 1,
        nickname: "플레이어1",
        avatar: { type: "emoji", value: "🦖" },
        isReady: true,
        isHost: true
      }
    ]
  }
  */
});</code>
        </div>

        <div class="event server-event">
            <h3><span class="badge">ON</span> member_joined</h3>
            <strong>설명:</strong> 새로운 플레이어가 방에 입장<br>
            <strong>데이터 구조:</strong>
            <code>socket.on('member_joined', (data) => {
  /*
  {
    roomId: 1,
    member: {
      id: 3,
      nickname: "새플레이어",
      avatar: { type: "emoji", value: "🐊" },
      isReady: false,
      isHost: false
    },
    currentMembers: 3
  }
  */
});</code>
        </div>

        <div class="event server-event">
            <h3><span class="badge">ON</span> member_left</h3>
            <strong>설명:</strong> 플레이어가 방에서 나감<br>
            <strong>데이터 구조:</strong>
            <code>socket.on('member_left', (data) => {
  /*
  {
    roomId: 1,
    userId: 2,
    nickname: "플레이어2",
    currentMembers: 2,
    newHostId: 3  // 방장이 바뀐 경우에만 포함
  }
  */
});</code>
        </div>

        <div class="event server-event">
            <h3><span class="badge">ON</span> member_kicked</h3>
            <strong>설명:</strong> 플레이어가 강퇴당함<br>
            <strong>데이터 구조:</strong>
            <code>socket.on('member_kicked', (data) => {
  /*
  {
    roomId: 1,
    kickedUserId: 2,
    kickedUserNickname: "플레이어2",
    kickedBy: 1,
    kickedByNickname: "방장",
    currentMembers: 2,
    newHostId: 3  // 방장이 바뀐 경우에만 포함
  }
  */
});</code>
        </div>

        <div class="event server-event">
            <h3><span class="badge">ON</span> member_ready_changed</h3>
            <strong>설명:</strong> 플레이어의 준비 상태가 변경됨<br>
            <strong>데이터 구조:</strong>
            <code>socket.on('member_ready_changed', (data) => {
  /*
  {
    roomId: 1,
    userId: 2,
    nickname: "플레이어2",
    isReady: true,
    allReady: false  // 모든 멤버 준비 여부
  }
  */
});</code>
        </div>

        <div class="event server-event">
            <h3><span class="badge">ON</span> game_countdown</h3>
            <strong>설명:</strong> 게임 시작 카운트다운 (모든 플레이어 준비 완료 시)<br>
            <strong>데이터 구조:</strong>
            <code>socket.on('game_countdown', (data) => {
  console.log(data.countdown + '초 남음!');
  /*
  {
    roomId: 1,
    countdown: 3  // 3 → 2 → 1 순서로 전송
  }
  */
});</code>
        </div>

        <div class="event server-event">
            <h3><span class="badge">ON</span> game_started</h3>
            <strong>설명:</strong> 게임이 시작됨<br>
            <strong>데이터 구조:</strong>
            <code>socket.on('game_started', (data) => {
  /*
  {
    roomId: 1,
    gameId: "game_1_1767836400000",
    startedAt: "2026-01-08T02:00:00.000Z"
  }
  */
});</code>
        </div>

        <h2 id="examples">💡 사용 예시</h2>

        <h3>완전한 플로우 예시</h3>
        <code>// 1. WebSocket 연결
const socket = io('http://localhost:3000/rooms', {
  auth: { token: userToken }
});

// 2. 연결 상태 모니터링
socket.on('connect', () => {
  console.log('Connected!', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// 3. 방에 입장 (방 코드 사용)
socket.emit('join_room', { roomCode: 'ABC123' });

// 4. 방 상태 업데이트 수신
socket.on('room_updated', (data) => {
  updateRoomUI(data.members);
  updateMemberCount(data.currentMembers, data.maxMembers);
});

// 5. 다른 플레이어 액션 수신
socket.on('member_joined', (data) => {
  showNotification(data.member.nickname + ' joined!');
});

socket.on('member_left', (data) => {
  showNotification(data.nickname + ' left.');
  if (data.newHostId) {
    showNotification('Host changed!');
  }
});

// 6. 준비 상태 관리
document.getElementById('readyBtn').onclick = () => {
  const isReady = !currentUser.isReady;
  socket.emit('ready_toggle', { roomId: 1, isReady });
};

socket.on('member_ready_changed', (data) => {
  updateMemberReady(data.userId, data.isReady);
  
  if (data.allReady) {
    showAlert('All players ready!');
  }
});

// 7. 게임 시작 처리
socket.on('game_countdown', (data) => {
  showCountdown(data.countdown);
  playCountdownSound();
});

socket.on('game_started', (data) => {
  hideWaitingRoom();
  startGame(data.gameId);
});

// 8. 강퇴 처리 (방장만)
document.getElementById('kickBtn').onclick = (targetUserId) => {
  socket.emit('kick_member', { roomId: 1, targetUserId });
};

socket.on('member_kicked', (data) => {
  if (data.kickedUserId === currentUser.id) {
    // 자신이 강퇴당한 경우
    alert('You were kicked from the room');
    window.location.href = '/rooms';
  } else {
    // 다른 사람이 강퇴당한 경우
    showNotification(data.kickedUserNickname + ' was kicked');
  }
});</code>

        <h3>에러 처리</h3>
        <code>socket.on('error', (data) => {
  switch (data.message) {
    case 'Unauthorized':
      // JWT token expired
      window.location.reload();
      break;
      
    case 'Room not found':
      // Room deleted
      alert('Room not found');
      window.location.href = '/rooms';
      break;
      
    case 'Already in another room':
      // Already playing in another tab
      alert('Already in game');
      break;
      
    default:
      alert('Error: ' + data.message);
  }
});</code>

        <h2 id="errors">⚠️ 주요 에러 및 해결방법</h2>

        <table>
            <tr>
                <th>에러 메시지</th>
                <th>원인</th>
                <th>해결방법</th>
            </tr>
            <tr>
                <td><code>No token provided</code></td>
                <td>JWT 토큰이 없음</td>
                <td>auth 객체에 토큰 포함하여 연결</td>
            </tr>
            <tr>
                <td><code>Unauthorized</code></td>
                <td>유효하지 않은 토큰</td>
                <td>토큰 갱신 후 재연결</td>
            </tr>
            <tr>
                <td><code>방을 찾을 수 없습니다</code></td>
                <td>존재하지 않는 방 ID</td>
                <td>방 목록에서 다시 선택</td>
            </tr>
            <tr>
                <td><code>이미 다른 방에 참가 중</code></td>
                <td>다중 탭에서 접속</td>
                <td>기존 방에서 나간 후 재입장</td>
            </tr>
            <tr>
                <td><code>KICKED_FROM_ROOM</code></td>
                <td>방장에 의해 강퇴됨</td>
                <td>방 목록으로 리다이렉트</td>
            </tr>
        </table>

        <div class="warning">
            <strong>⚠️ 주의사항:</strong>
            <ul>
                <li>JWT 토큰이 만료되면 자동으로 연결이 끊어집니다.</li>
                <li>브라우저 탭을 닫으면 자동으로 방에서 나가집니다.</li>
                <li>방장이 나가면 다음 멤버가 자동으로 방장이 됩니다.</li>
                <li>최소 2명이 모두 준비해야 게임이 시작됩니다.</li>
            </ul>
        </div>

        <div class="info">
            <strong>🔗 관련 링크:</strong>
            <ul>
                <li><a href="/api-docs" target="_blank">REST API 문서 (Swagger)</a></li>
                <li><a href="https://socket.io/docs/v4/" target="_blank">Socket.IO 공식 문서</a></li>
            </ul>
        </div>

        <hr style="margin: 40px 0;">
        <p style="text-align: center; color: #7f8c8d;">
            📝 마지막 업데이트: 2026-01-08 | 
            🏠 <a href="/" style="color: #3498db;">메인으로 돌아가기</a>
        </p>
    </div>

    <script>
        // 부드러운 스크롤링
        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                document.getElementById(targetId).scrollIntoView({ 
                    behavior: 'smooth' 
                });
            });
        });
    </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
