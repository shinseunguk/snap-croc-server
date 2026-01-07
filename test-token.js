const jwt = require('jsonwebtoken');

// JWT_SECRET은 보통 .env에 있거나 기본값 사용
const secret = 'snap-croc-super-secret-jwt-key-2025';

// 테스트 사용자 데이터 (userId: 1, 위에서 생성한 사용자)
const payload = {
  sub: 1,
  email: 'test@snap-croc.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1시간
};

const token = jwt.sign(payload, secret);
console.log('Test JWT Token:');
console.log(token);