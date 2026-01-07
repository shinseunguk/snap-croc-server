import { DataSource } from 'typeorm';
import { seedUsers } from './user.seed';
import configuration from '../../config/configuration';

async function runSeed() {
  const config = configuration();
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.database,
    entities: [__dirname + '/../../entities/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('데이터베이스에 연결되었습니다.');

    // 시드 데이터 실행
    console.log('테스트 데이터를 생성합니다...');
    await seedUsers(dataSource);
    
    console.log('모든 시드 데이터가 생성되었습니다.');
  } catch (error) {
    console.error('시드 데이터 생성 중 오류가 발생했습니다:', error);
  } finally {
    await dataSource.destroy();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  runSeed();
}

export { runSeed };