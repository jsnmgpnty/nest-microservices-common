import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from 'nest-microservices-logger';
import { CommonModulePlatform } from '../common-config-options';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
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
    const url = request.url;
    const type = request.method;
    const status = request.statusCode;

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => {
          this.loggerService.log(`${type} - ${status}: ${url} - ${Date.now() - now}ms`);
        }),
      );
  }
}
