import * as os from 'os';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Isolate this run from the real production data/tags.db and from the real
// TCP/HTTP ports so the e2e suite never touches production state.
process.env.DB_PATH = path.join(os.tmpdir(), `antenas-ctac-e2e-${Date.now()}.db`);
process.env.PORT = '0';
process.env.HTTP_PORT = '0';
process.env.HOST = '127.0.0.1';
process.env.LOG_LEVEL = 'silent';

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.ok).toBe(true);
      });
  });

  it('GET /api/tags/:id returns 404 for an unknown tag', () => {
    return request(app.getHttpServer())
      .get('/api/tags/doesnotexist')
      .expect(404);
  });

  it('GET /api/tags/pending does not collide with GET /api/tags/:id', () => {
    return request(app.getHttpServer())
      .get('/api/tags/pending')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ total: 0, limit: 1000, data: [] });
      });
  });
});
