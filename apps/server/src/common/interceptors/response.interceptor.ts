import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";
import type { ApiResponse } from "../interfaces/api-response.interface";

type MaybeWrappedResponse<T> = ApiResponse<T> | T;

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: MaybeWrappedResponse<T>) => {
        if (this.isApiResponse(data)) {
          return data;
        }

        return {
          code: 200,
          data,
          message: "success",
        } satisfies ApiResponse<T>;
      }),
    );
  }

  private isApiResponse(input: MaybeWrappedResponse<T>): input is ApiResponse<T> {
    return (
      typeof input === "object"
      && input !== null
      && "code" in input
      && "data" in input
      && "message" in input
    );
  }
}
