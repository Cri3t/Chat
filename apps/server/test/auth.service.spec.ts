import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { InMemoryPrismaMock } from "./mocks/in-memory-prisma.mock";

function createAuthService(prisma: InMemoryPrismaMock) {
  const jwtService = new JwtService();
  const configService = new ConfigService({
    JWT_ACCESS_SECRET: "access-secret",
    JWT_REFRESH_SECRET: "refresh-secret",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
  });

  return new AuthService(prisma as any, jwtService, configService);
}

describe("AuthService", () => {
  it("registers user with password hash", async () => {
    const prisma = new InMemoryPrismaMock();
    const service = createAuthService(prisma);

    const result = await service.register({
      username: "alice",
      email: "alice@example.com",
      nickname: "Alice",
      phone: "18800000001",
      password: "Password123",
      confirmPassword: "Password123",
      gender: 0,
      userType: 1,
    });

    expect(result.username).toBe("alice");
    const userInDb = await prisma.user.findUnique({ where: { username: "alice" } });
    expect(userInDb.passwordHash).not.toBe("Password123");
  });

  it("logs in with valid password and returns tokens", async () => {
    const prisma = new InMemoryPrismaMock();
    await prisma.seedUser({
      username: "tom",
      password: "Password123",
      phone: "18800000002",
    });
    const service = createAuthService(prisma);

    const result = await service.login({
      username: "tom",
      password: "Password123",
    });

    expect(result.token).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.userInfo.username).toBe("tom");
  });

  it("rejects refresh after logout", async () => {
    const prisma = new InMemoryPrismaMock();
    await prisma.seedUser({
      username: "jerry",
      password: "Password123",
      phone: "18800000003",
    });
    const service = createAuthService(prisma);

    const loginResult = await service.login({
      username: "jerry",
      password: "Password123",
    });

    await service.logout(loginResult.userInfo.id);

    await expect(
      service.refresh({
        refreshToken: loginResult.refreshToken,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
