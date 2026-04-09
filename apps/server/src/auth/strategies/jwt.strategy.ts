import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtUserPayload } from "../types/jwt-user-payload.type";

function extractLegacyToken(request: { headers?: Record<string, string | string[] | undefined> }) {
  const tokenValue = request?.headers?.token;
  if (Array.isArray(tokenValue)) {
    return tokenValue[0];
  }
  return tokenValue;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secretOrKey = configService.get<string>("JWT_ACCESS_SECRET");
    if (!secretOrKey) {
      throw new UnauthorizedException("JWT_ACCESS_SECRET is required");
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractLegacyToken,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtUserPayload) {
    return payload;
  }
}
