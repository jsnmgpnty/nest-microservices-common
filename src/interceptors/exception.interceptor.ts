import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoggerService } from 'nest-microservices-logger';
import { CommonModulePlatform, CommonConfigOptions } from '../common-config-options';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  constructor(
    private loggerService: LoggerService,
    @Inject('COMMON_CONFIG_OPTIONS') private configOptions: CommonConfigOptions,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = this.configOptions.platform === CommonModulePlatform.EXPRESS
      ? ctx.getRequest()
      : ctx.getRequest().raw;
    const response = this.configOptions.platform === CommonModulePlatform.EXPRESS
      ? ctx.getResponse()
      : ctx.getResponse().raw;
    if (!request || !response) return next.handle();

    const status = response.statusCode;
    const url = request.url;
    const method = request.method;

    return next
      .handle()
      .pipe(
        catchError(err => {
          this.loggerService.error(
            `Error encountered when hitting ${method} - ${url} - status: ${status} - timestamp: ${new Date().toISOString()}`,
            err
          );
          if (this.configOptions.platform === CommonModulePlatform.EXPRESS) {
            return throwError(err);
          }

          const { response } = err;
          return throwError(new HttpException(response, HttpStatus.BAD_REQUEST));
        }),
      );
  }
}