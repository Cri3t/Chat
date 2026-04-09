import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { createHash } from "node:crypto";
import { JwtService } from "@nestjs/jwt";
import { BusinessException } from "../common/exceptions/business.exception";
import { PrismaService } from "../prisma/prisma.service";
import type { LoginDto } from "./dto/login.dto";
import type { RefreshTokenDto } from "./dto/refresh-token.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { JwtUserPayload } from "./types/jwt-user-payload.type";

type LoginResponse = {
  token: string;
  refreshToken: string;
  userInfo: {
    id: number;
    username: string;
    email: string;
    nickname: string;
    phone: string;
    gender: number;
    userType: number;
  };
};

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const accessSecret = this.configService.get<string>("JWT_ACCESS_SECRET");
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!accessSecret || !refreshSecret) {
      throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required");
    }
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn = this.configService.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m";
    this.refreshExpiresIn = this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d";
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BusinessException(40002, "password and confirmPassword do not match");
    }

    const existedUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }, { phone: dto.phone }],
      },
      select: {
        id: true,
      },
    });

    if (existedUser) {
      throw new BusinessException(40003, "username/email/phone already exists");
    }

    const passwordHash = await hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        nickname: dto.nickname,
        phone: dto.phone,
        passwordHash,
        gender: dto.gender,
        userType: dto.userType,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        phone: true,
        gender: true,
        userType: true,
        createdAt: true,
      },
    });

    return created;
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user) {
      throw new BusinessException(40004, "username or password is invalid");
    }

    const matched = await compare(dto.password, user.passwordHash);
    if (!matched) {
      throw new BusinessException(40004, "username or password is invalid");
    }

    await this.revokeAllActiveTokens(user.id);
    return this.issueLoginTokens(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const tokenHash = this.hashToken(dto.refreshToken);
    const now = new Date();

    const record = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });

    if (!record) {
      throw new UnauthorizedException("refresh token is invalid");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException("user does not exist");
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: now },
    });

    return this.issueLoginTokens(user);
  }

  async logout(userId: number, refreshToken?: string) {
    const now = new Date();
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: now },
      });
      return { success: true };
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
    return { success: true };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        phone: true,
        gender: true,
        userType: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("user does not exist");
    }

    return user;
  }

  private async issueLoginTokens(user: User): Promise<LoginResponse> {
    const payload: JwtUserPayload = {
      sub: user.id,
      username: user.username,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
      }),
    ]);

    const refreshTokenExpireAt = this.getTokenExpiresAt(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshTokenExpireAt,
      },
    });

    return {
      token: accessToken,
      refreshToken,
      userInfo: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        phone: user.phone,
        gender: user.gender,
        userType: user.userType,
      },
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtUserPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtUserPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("refresh token is invalid");
    }
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private getTokenExpiresAt(token: string) {
    const decoded = this.jwtService.decode(token);
    if (!decoded || typeof decoded !== "object" || typeof decoded.exp !== "number") {
      throw new Error("failed to decode token expiration");
    }
    return new Date(decoded.exp * 1000);
  }

  private async revokeAllActiveTokens(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
