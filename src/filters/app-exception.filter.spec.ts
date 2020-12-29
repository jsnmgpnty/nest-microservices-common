import { CommonModulePlatform } from '../common-config-options';
import { AppException, BaseErrors, ErrorInfo } from '../models';
import { AppExceptionFilter } from './app-exception.filter';

describe('AppExceptionFilter', () => {
  describe('constructor', () => {
    it('should be defined', () => {
      expect(new AppExceptionFilter(null)).toBeDefined();
    });
  });

  describe('catch', () => {
    let mockSend;
    let mockResponse;
    let mockArgumentsHost;

    beforeEach(() => {
      mockSend = jest.fn();
      mockResponse = {
        status: jest.fn().mockReturnValue({
          send: mockSend,
        }),
      };
      mockArgumentsHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
        }),
      };
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should send error from AppException with express platform', () => {
      const filter = new AppExceptionFilter({
        platform: CommonModulePlatform.EXPRESS,
      });
      const exception = new AppException(
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, 'message', 400),
      );
      filter.catch(exception, mockArgumentsHost);
      expect(mockResponse.status).toBeCalledWith(exception.statusCode);
      expect(mockSend).toBeCalledWith(exception);
    });
    it('should send default error status code if not provided from exception', () => {
      const filter = new AppExceptionFilter({
        platform: CommonModulePlatform.EXPRESS,
      });
      const exception = new AppException(
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, 'message'),
      );
      exception.statusCode = null;
      filter.catch(exception, mockArgumentsHost);
      expect(mockResponse.status).toBeCalledWith(500);
    });
    it('should send error from AppException with fastify platform', () => {
      mockArgumentsHost = {
        switchToHttp: () => ({
          getResponse: () => ({
            raw: mockResponse,
          }),
        }),
      };
      const filter = new AppExceptionFilter({
        platform: CommonModulePlatform.FASTIFY,
      });
      const exception = new AppException(
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, 'message', 400),
      );
      filter.catch(exception, mockArgumentsHost);
      expect(mockResponse.status).toBeCalledWith(exception.statusCode);
      expect(mockSend).toBeCalledWith(exception);
    });
  });
});
