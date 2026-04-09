import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { NestExpressApplication } from "@nestjs/platform-express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { JwtStrategy } from "../src/auth/strategies/jwt.strategy";
import { JwtAuthGuard } from "../src/common/guards/jwt-auth.guard";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";
import { PrismaService } from "../src/prisma/prisma.service";
import { InMemoryPrismaMock } from "./mocks/in-memory-prisma.mock";

describe("AuthController (e2e)", () => {
  let app: NestExpressApplication;
  const prisma = new InMemoryPrismaMock();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_ACCESS_SECRET: "access-secret",
              JWT_REFRESH_SECRET: "refresh-secret",
              JWT_ACCESS_EXPIRES_IN: "15m",
              JWT_REFRESH_EXPIRES_IN: "7d",
            }),
          ],
        }),
        PassportModule,
        JwtModule.register({}),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        {
          provide: PrismaService,
          useValue: prisma as any,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("register -> login -> profile -> refresh -> logout -> refresh failed", async () => {
    const registerRes = await request(app.getHttpServer())
      .post("/api/user/add")
      .send({
        username: "e2e_user",
        email: "e2e_user@example.com",
        nickname: "E2E User",
        phone: "18800000011",
        password: "Password123",
        confirmPassword: "Password123",
        gender: 0,
        userType: 1,
      })
      .expect(201);

    expect(registerRes.body.code).toBe(200);
    expect(registerRes.body.data.username).toBe("e2e_user");

    const loginRes = await request(app.getHttpServer())
      .post("/api/user/login")
      .send({
        username: "e2e_user",
        password: "Password123",
      })
      .expect(201);

    expect(loginRes.body.code).toBe(200);
    const accessToken = loginRes.body.data.token as string;
    const refreshToken = loginRes.body.data.refreshToken as string;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    const profileRes = await request(app.getHttpServer())
      .get("/api/user/profile")
      .set("token", accessToken)
      .expect(200);

    expect(profileRes.body.code).toBe(200);
    expect(profileRes.body.data.username).toBe("e2e_user");

    const refreshRes = await request(app.getHttpServer())
      .post("/api/user/refresh")
      .send({ refreshToken })
      .expect(201);
    expect(refreshRes.body.code).toBe(200);

    const logoutRes = await request(app.getHttpServer())
      .post("/api/user/logout")
      .set("token", accessToken)
      .send({ refreshToken: refreshRes.body.data.refreshToken })
      .expect(201);
    expect(logoutRes.body.code).toBe(200);

    const refreshFailRes = await request(app.getHttpServer())
      .post("/api/user/refresh")
      .send({ refreshToken: refreshRes.body.data.refreshToken })
      .expect(401);

    expect(refreshFailRes.body.code).toBe(-1);
  });
});
