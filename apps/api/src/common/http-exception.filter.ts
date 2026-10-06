import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { errorBody } from "./api-response";

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const response = context.getResponse();
    const prismaUnavailable = this.isPrismaUnavailable(exception);
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      prismaUnavailable
        ? "Database is unavailable. Start PostgreSQL and run migrations before using this endpoint."
        :
      exception instanceof HttpException
        ? String(exception.message || "Request failed")
        : "Internal server error";
    const responseStatus = prismaUnavailable ? HttpStatus.SERVICE_UNAVAILABLE : status;
    const code = prismaUnavailable ? "DATABASE_UNAVAILABLE" : this.codeForStatus(responseStatus);

    response.status(responseStatus).json(errorBody(code, message, { requestId: this.requestId(request) }));
  }

  private codeForStatus(status: number) {
    if (status === HttpStatus.BAD_REQUEST) return "INVALID_REQUEST";
    if (status === HttpStatus.UNAUTHORIZED) return "UNAUTHORIZED";
    if (status === HttpStatus.FORBIDDEN) return "FORBIDDEN";
    if (status === HttpStatus.NOT_FOUND) return "NOT_FOUND";
    if (status === HttpStatus.CONFLICT) return "CONFLICT";
    if (status === HttpStatus.TOO_MANY_REQUESTS) return "RATE_LIMITED";
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return "SERVICE_UNAVAILABLE";
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) return "INTERNAL_SERVER_ERROR";
    return "REQUEST_FAILED";
  }

  private isPrismaUnavailable(exception: unknown) {
    if (!(exception instanceof Error)) return false;
    return (
      exception.name === "PrismaClientInitializationError" ||
      exception.message.includes("Can't reach database server") ||
      exception.message.includes("connect ECONNREFUSED")
    );
  }

  private requestId(request: { headers?: Record<string, string | string[] | undefined> }) {
    const value = request.headers?.["x-request-id"];
    return Array.isArray(value) ? value[0] : value;
  }
}
