import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import * as rawbody from 'raw-body';
import { CommonModulePlatform, CommonConfigOptions } from '../common-config-options';

@Injectable()
export class RequestSanitizerInterceptor implements NestInterceptor {
  constructor(@Inject('COMMON_CONFIG_OPTIONS') private configOptions: CommonConfigOptions) { }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (this.configOptions.platform === CommonModulePlatform.EXPRESS) {
      return this.handleExpressIntercept(context, next);
    }
    return this.handleFastifyIntercept(context, next);
  }

  async handleExpressIntercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    if (!request || !response) return next.handle();
    const type = request.method;
    if (type.toLowerCase() !== 'post' || !request.body) return next.handle();
    if (typeof request.body === 'string') {
      request.body = JSON.parse(request.body);
      return next.handle();
    }

    if (request.readable && !this.isMultipartFormData(request)) {
      // body is ignored by NestJS -> get raw body from request
      const raw = await rawbody(request);
      const text = raw.toString().trim();
      request.body = JSON.parse(text);
    }
    return next.handle();
  }

  async handleFastifyIntercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse().raw;
    if (!request || !request.raw || !response) return next.handle();
    const type = request.raw.method;
    if (type.toLowerCase() === 'post' && request.body && typeof request.body === 'string') {
      request.body = JSON.parse(request.body);
    }
    return next.handle();
  }

  private isMultipartFormData (req: Request): boolean {
    if (!req || !req.headers) return false;
    return req.headers['content-type'].includes('multipart/form-data');
  }
}
