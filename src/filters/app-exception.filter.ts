import { ArgumentsHost, Catch, ExceptionFilter, Inject } from '@nestjs/common';
import { Response } from 'express';
import { CommonModulePlatform } from '../common-config-options';
import { AppException } from '../models';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(@Inject('COMMON_CONFIG_OPTIONS') private configOptions: CommonConfigOptions) { }

  catch(exception: AppException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = this.configOptions.platform === CommonModulePlatform.EXPRESS
      ? ctx.getResponse<Response>()
      : ctx.getResponse().raw;
  
    if (this.configOptions.platform === CommonModulePlatform.EXPRESS) {
      response
        .status(exception?.statusCode || 500)
        .send(exception);
    } else {
      response
        .status(exception?.statusCode || 500)
        .send(exception);
    }
  }
}
