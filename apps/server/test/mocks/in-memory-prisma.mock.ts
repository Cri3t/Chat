import { hash } from "bcryptjs";
import { createHash } from "node:crypto";

type UserEntity = {
  id: number;
  username: string;
  email: string;
  nickname: string;
  phone: string;
  passwordHash: string;
  gender: number;
  userType: number;
  createdAt: Date;
  updatedAt: Date;
};

type RefreshTokenEntity = {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
};

type PrismaSelect = Record<string, boolean>;

function selectFields<T extends Record<string, unknown>>(source: T, select?: PrismaSelect) {
  if (!select) {
    return source;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(select)) {
    if (select[key]) {
      result[key] = source[key];
    }
  }
  return result;
}

export class InMemoryPrismaMock {
  private userIdSeq = 1;
  private refreshIdSeq = 1;
  private users: UserEntity[] = [];
  private refreshTokens: RefreshTokenEntity[] = [];

  readonly user: Record<string, any> = {};
  readonly refreshToken: Record<string, any> = {};

  constructor() {
    this.bindMethods();
  }

  async seedUser(params: {
    username: string;
    password: string;
    email?: string;
    nickname?: string;
    phone?: string;
    gender?: number;
    userType?: number;
  }) {
    const now = new Date();
    const entity: UserEntity = {
      id: this.userIdSeq++,
      username: params.username,
      email: params.email ?? `${params.username}@example.com`,
      nickname: params.nickname ?? params.username,
      phone: params.phone ?? `1880000${this.userIdSeq}`,
      passwordHash: await hash(params.password, 10),
      gender: params.gender ?? 0,
      userType: params.userType ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(entity);
    return entity;
  }

  async $transaction<T>(tasks: Promise<T>[]) {
    return Promise.all(tasks);
  }

  hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private bindMethods() {
    this.user.findFirst = async (args: any) => {
      const conditions = args?.where?.OR ?? [];
      const found = this.users.find((user) =>
        conditions.some((condition: any) =>
          (condition.username && condition.username === user.username)
          || (condition.email && condition.email === user.email)
          || (condition.phone && condition.phone === user.phone),
        ),
      );
      if (!found) {
        return null;
      }
      return selectFields(found as Record<string, unknown>, args?.select as PrismaSelect);
    };

    this.user.findUnique = async (args: any) => {
      let found: UserEntity | null = null;
      if (args?.where?.username) {
        found = this.users.find(user => user.username === args.where.username) ?? null;
      } else if (args?.where?.id) {
        found = this.users.find(user => user.id === args.where.id) ?? null;
      }
      if (!found) {
        return null;
      }
      return selectFields(found as Record<string, unknown>, args?.select as PrismaSelect);
    };

    this.user.create = async (args: any) => {
      const now = new Date();
      const created: UserEntity = {
        id: this.userIdSeq++,
        username: args.data.username,
        email: args.data.email,
        nickname: args.data.nickname,
        phone: args.data.phone,
        passwordHash: args.data.passwordHash,
        gender: args.data.gender,
        userType: args.data.userType,
        createdAt: now,
        updatedAt: now,
      };
      this.users.push(created);
      return selectFields(created as Record<string, unknown>, args?.select as PrismaSelect);
    };

    this.refreshToken.create = async (args: any) => {
      const created: RefreshTokenEntity = {
        id: this.refreshIdSeq++,
        userId: args.data.userId,
        tokenHash: args.data.tokenHash,
        expiresAt: args.data.expiresAt,
        revokedAt: null,
        createdAt: new Date(),
      };
      this.refreshTokens.push(created);
      return created;
    };

    this.refreshToken.findFirst = async (args: any) => {
      return this.refreshTokens.find((token) => {
        const userMatch = args.where.userId ? token.userId === args.where.userId : true;
        const hashMatch = args.where.tokenHash ? token.tokenHash === args.where.tokenHash : true;
        const revokedMatch = args.where.revokedAt === null ? token.revokedAt === null : true;
        const expiryMatch = args.where.expiresAt?.gt
          ? token.expiresAt.getTime() > args.where.expiresAt.gt.getTime()
          : true;
        return userMatch && hashMatch && revokedMatch && expiryMatch;
      }) ?? null;
    };

    this.refreshToken.update = async (args: any) => {
      const current = this.refreshTokens.find(token => token.id === args.where.id);
      if (!current) {
        throw new Error("refresh token not found");
      }
      current.revokedAt = args.data.revokedAt ?? current.revokedAt;
      return current;
    };

    this.refreshToken.updateMany = async (args: any) => {
      let count = 0;
      for (const token of this.refreshTokens) {
        const userMatch = args.where.userId ? token.userId === args.where.userId : true;
        const hashMatch = args.where.tokenHash ? token.tokenHash === args.where.tokenHash : true;
        const revokedMatch = args.where.revokedAt === null ? token.revokedAt === null : true;
        if (userMatch && hashMatch && revokedMatch) {
          token.revokedAt = args.data.revokedAt ?? token.revokedAt;
          count += 1;
        }
      }
      return { count };
    };
  }
}
