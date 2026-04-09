import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    try {
      if (exception instanceof HttpException) {
        const resObj = exception.getResponse();
        const status = exception.getStatus();
        return response.status(status).json(resObj);
      }

      const err = exception as any;
      this.logger.error(err?.message || 'Unhandled exception', err?.stack);

      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const resObj = {
        statusCode: status,
        message: 'Sorry, we are unable to process your request',
        error: err?.message || 'Internal server error',
      };
      return response.status(status).json(resObj);
    } catch (ex) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Sorry, we are unable to process your request',
      });
    }
  }
}
