import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { string } from 'joi';
import { JWTPayload } from '../src/common/interface/jwtpayload.interface';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const newUser = {
    name: 'Ini',
    email: 'ini@ini.com',
    password: 'password',
  };
  const newAdmin = {
    name: 'Inia',
    email: 'inia@ini.com',
    password: 'password',
    admin: true,
  };
  let userToken: string;
  let user: JWTPayload;
  let adminToken: string;
  let admin: JWTPayload;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // app.useLogger(new Logger());
    await app.init();
  });

  it('/api/_health (GET)', () => {
    return request(app.getHttpServer()).get('/api/_health').expect(200).expect('OK');
  });

  it('/user (POST) should create new user', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send(newUser)
      .then((data) => {
        user = JSON.parse(data.text);
        expect(JSON.parse(data.text)).toHaveProperty('is_admin', false);
        expect(JSON.parse(data.text)).toHaveProperty('id');
      });
  });

  it('/user (POST) should create new admin', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send(newAdmin)
      .then((data) => {
        admin = JSON.parse(data.text);
        expect(JSON.parse(data.text)).toHaveProperty('is_admin', true);
        expect(JSON.parse(data.text)).toHaveProperty('id');
      });
  });

  it('/user/token (POST) should authenticate user and return jwt', () => {
    return request(app.getHttpServer())
      .post('/user/token')
      .send({ email: newUser.email, password: newUser.password })
      .then((data) => {
        const res = JSON.parse(data.text);
        userToken = res.token;
        expect(JSON.parse(data.text)).toHaveProperty('token');
      });
  });

  it('/user/token (POST) should authenticate admin and return jwt', () => {
    return request(app.getHttpServer())
      .post('/user/token')
      .send({ email: newAdmin.email, password: newAdmin.password })
      .then((data) => {
        const res = JSON.parse(data.text);
        adminToken = res.token;
        expect(JSON.parse(data.text)).toHaveProperty('token');
      });
  });

  it('/user/authenticate (POST) should authenticate user and return true', () => {
    return request(app.getHttpServer())
      .post('/user/authenticate')
      .send({ email: newUser.email, password: newUser.password })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.credentials).toEqual(true);
      });
  });

  it('/user/authenticate (POST) should authenticate admin and return true', () => {
    return request(app.getHttpServer())
      .post('/user/authenticate')
      .send({ email: newAdmin.email, password: newAdmin.password })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.credentials).toEqual(true);
      });
  });

  it('/user/authenticate (POST) should not authenticate user and return false', () => {
    return request(app.getHttpServer())
      .post('/user/authenticate')
      .send({ email: newUser.email, password: 'false' })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.credentials).toEqual(false);
      });
  });

  it('/user/authenticate (POST) should not authenticate admin and return false', () => {
    return request(app.getHttpServer())
      .post('/user/authenticate')
      .send({ email: newAdmin.email, password: 'false' })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.credentials).toEqual(false);
      });
  });

  it('/user/validate (POST) should authenticate user token and return jwt payload', () => {
    return request(app.getHttpServer()).post('/user/validate').set('Authorization', `Bearer ${userToken}`).expect(200);
  });

  it('/user/validate (POST) should authenticate admin token and return jwt payload', () => {
    return request(app.getHttpServer()).post('/user/validate').set('Authorization', `Bearer ${adminToken}`).expect(200);
  });

  it('/user/validate (POST) should not authenticate user', () => {
    return request(app.getHttpServer()).post('/user/validate').expect(500);
  });

  it('/user/validate (POST) should not authenticate admin', () => {
    return request(app.getHttpServer()).post('/user/validate').expect(500);
  });

  it('/user/:id (GET) should authenticate user token and return signed in user', () => {
    return request(app.getHttpServer())
      .get(`/user/${user.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .then((data) => {
        expect(JSON.parse(data.text)).toHaveProperty('id', user.id);
      });
  });

  it('/user/:id (GET) should authenticate user token and return 401', () => {
    return request(app.getHttpServer()).get('/user/5').set('Authorization', `Bearer ${userToken}`).expect(401);
  });

  it('/user/:id (GET) should authenticate admin token and return any user', () => {
    return request(app.getHttpServer())
      .get(`/user/${user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        expect(JSON.parse(data.text)).toHaveProperty('id', user.id);
      });
  });

  it('/user/:id (GET) should authenticate admin token and return any user', () => {
    return request(app.getHttpServer())
      .get(`/user/${admin.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        expect(JSON.parse(data.text)).toHaveProperty('id', admin.id);
      });
  });

  it('/user (GET) should authenticate user token and return signed user', () => {
    return request(app.getHttpServer())
      .get('/user')
      .set('Authorization', `Bearer ${userToken}`)
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res[0]).toHaveProperty('id', user.id);
      });
  });

  it('/user (GET) should authenticate user token and return signed user', () => {
    return request(app.getHttpServer())
      .get('/user?id=7')
      .set('Authorization', `Bearer ${userToken}`)
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res[0]).toHaveProperty('id', user.id);
      });
  });

  it('/user (GET) should authenticate admin token and return any user', () => {
    return request(app.getHttpServer())
      .get('/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.length).toBeGreaterThan(2);
      });
  });

  it('/user (GET) should authenticate admin token and return any user', () => {
    return request(app.getHttpServer())
      .get(`/user?id=${user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res[0]).toHaveProperty('id', user.id);
      });
  });

  it('/user (PATCH) should authenticate user token and return updated user', () => {
    return request(app.getHttpServer())
      .patch('/user')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ id: user.id, name: 'test' })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.name).toEqual('test');
      });
  });

  it('/user (PATCH) should authenticate user token and return 401', () => {
    return request(app.getHttpServer())
      .patch('/user')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ id: admin.id, name: 'test' })
      .expect(401);
  });

  it('/user (PATCH) should authenticate admin token and return updated user', () => {
    return request(app.getHttpServer())
      .patch('/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: admin.id, name: 'testing' })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.name).toEqual('testing');
      });
  });

  it('/user (PATCH) should authenticate admin token and return updated user', () => {
    return request(app.getHttpServer())
      .patch('/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: user.id, name: 'testing' })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.name).toEqual('testing');
      });
  });

  it('/user (DELETE) should authenticate admin token and return deleted user', () => {
    return request(app.getHttpServer())
      .delete('/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: user.id })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.users).toHaveProperty('name', '(deleted)');
        expect(res.users).toHaveProperty('email', 'null');
      });
  });
});
