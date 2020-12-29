import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { LoggerService } from 'nest-microservices-logger';
import { FilterQuery } from 'mongoose';
import { BaseService } from './base.service';
import { BaseEntity, BaseErrors, EntityMetadata, ErrorInfo } from '../models';
import { BaseRepository, FindModelOptions } from '../database/base.repository';

type TestClass = TestClassEntity & BaseEntity;

class TestClassEntity {
  name: String;
}

@Injectable()
class TestRepository extends BaseRepository<TestClass> {}

@Injectable()
class TestService extends BaseService<TestClass, TestRepository> {
  constructor(repository: TestRepository, logger: LoggerService) {
    super(repository, logger);
  }

  async find(
    cond?: FilterQuery<TestClass>,
    options?: FindModelOptions<TestClass>,
  ): Promise<EntityMetadata<TestClass[]>> {
    return super.find(cond, options);
  }

  async findById(id: string): Promise<EntityMetadata<TestClass>> {
    return super.findById(id);
  }

  async findOne(
    cond?: FilterQuery<TestClass>,
  ): Promise<EntityMetadata<TestClass>> {
    return super.findOne(cond);
  }

  async create(model: TestClass): Promise<EntityMetadata<TestClass>> {
    return super.create(model);
  }

  async update(
    id: string,
    model: TestClass,
  ): Promise<EntityMetadata<TestClass>> {
    return super.update(id, model);
  }

  async delete(id: string): Promise<EntityMetadata<boolean>> {
    return super.delete(id);
  }

  convertToEntityMetadata<TestClass>(
    err: ErrorInfo,
    result?: TestClass | undefined | null,
  ): EntityMetadata<TestClass> {
    return super.convertToEntityMetadata(err, result);
  }

  getErrorEntityMetadata<TestClass>(
    type: string,
    message: string = undefined,
    statusCode = 400,
    error: any = null,
  ): EntityMetadata<TestClass> {
    return super.getErrorEntityMetadata(type, message, statusCode, error);
  }
}

describe('BaseService', () => {
  interface MockBaseRepository {
    create: jest.Mock<Promise<TestClass>, [TestClass]>;
    update: jest.Mock<Promise<TestClass>, [string, TestClass]>;
    delete: jest.Mock<Promise<{ ok?: number; n?: number }>, [string]>;
    find: jest.Mock<
      Promise<TestClass[]>,
      [FilterQuery<TestClass>, FindModelOptions<TestClass>]
    >;
    getAll: jest.Mock<Promise<TestClass[]>>;
    findById: jest.Mock<Promise<TestClass>, [string]>;
    findOne: jest.Mock<Promise<TestClass>, [object]>;
  }

  interface MockLoggerService {
    error: jest.Mock<void>;
  }

  let mockBaseRepository: MockBaseRepository;
  let mockLoggerService: MockLoggerService;
  let service: TestService;

  beforeEach(async () => {
    mockBaseRepository = {
      create: jest.fn().mockResolvedValue({ name: 'foobar' }),
      update: jest.fn().mockResolvedValue({ name: 'foobar' }),
      delete: jest.fn().mockResolvedValue({ ok: 1, n: 1 }),
      find: jest
        .fn()
        .mockResolvedValue([{ name: 'foobar' }, { name: 'barbaz' }]),
      getAll: jest
        .fn()
        .mockResolvedValue([{ name: 'foobar' }, { name: 'barbaz' }]),
      findById: jest.fn().mockResolvedValue({ name: 'foobar' }),
      findOne: jest.fn().mockResolvedValue({ name: 'foobar' }),
    };

    mockLoggerService = {
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestService,
        {
          provide: TestRepository,
          useValue: mockBaseRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<TestService>(TestService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    it('should call repository.create and return result successfully', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const result = await service.create(param as TestClass);
      expect(mockBaseRepository.create).toBeCalledWith(param);
      expect(result).toMatchObject({ data: { name: 'foobar' } });
    });
    it('should return error if response is empty from repository', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      mockBaseRepository.create.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      const result = await service.create(param as TestClass);
      expect(result).toMatchObject(expected);
    });
    it('should return error if unhandled error occurs', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const expectedError = new Error('error');
      mockBaseRepository.create.mockRejectedValue(expectedError);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(
          BaseErrors.FAILED_TO_CREATE_RESOURCE,
          null,
          400,
          expectedError,
        ),
      );
      const result = await service.create(param as TestClass);
      expect(result).toMatchObject(expected);
      expect(mockLoggerService.error).toBeCalled();
    });
  });

  describe('getAll', () => {
    it('should call repository.getAll and return result successfully', async () => {
      const result = await service.getAll();
      expect(mockBaseRepository.getAll).toBeCalled();
      expect(result).toMatchObject({
        data: [{ name: 'foobar' }, { name: 'barbaz' }],
      });
    });
    it('should return error if response is empty from repository', async () => {
      mockBaseRepository.getAll.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      const result = await service.getAll();
      expect(result).toMatchObject(expected);
    });
    it('should return error if unhandled error occurs', async () => {
      const expectedError = new Error('error');
      mockBaseRepository.getAll.mockRejectedValue(expectedError);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, null, 400, expectedError),
      );
      const result = await service.getAll();
      expect(result).toMatchObject(expected);
      expect(mockLoggerService.error).toBeCalled();
    });
  });

  describe('update', () => {
    it('should call repository.update and return result successfully', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const result = await service.update('id', param as TestClass);
      expect(mockBaseRepository.update).toBeCalledWith('id', param);
      expect(result).toMatchObject({ data: { name: 'foobar' } });
    });
    it('should return error if response is empty from repository', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      mockBaseRepository.update.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      const result = await service.update('id', param as TestClass);
      expect(result).toMatchObject(expected);
    });
    it('should return error if model to be updated is not found by id', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      mockBaseRepository.findById.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.NOT_FOUND, null, 404),
      );
      const result = await service.update('id', param as TestClass);
      expect(result).toMatchObject(expected);
    });
    it('should return error if unhandled error occurs', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const expectedError = new Error('error');
      mockBaseRepository.update.mockRejectedValue(expectedError);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(
          BaseErrors.FAILED_TO_UPDATE_RESOURCE,
          null,
          400,
          expectedError,
        ),
      );
      const result = await service.update('id', param as TestClass);
      expect(result).toMatchObject(expected);
      expect(mockLoggerService.error).toBeCalled();
    });
  });

  describe('delete', () => {
    it('should call repository.delete and return result successfully', async () => {
      const result = await service.delete('id');
      expect(mockBaseRepository.delete).toBeCalledWith('id');
      expect(result).toMatchObject({ data: true });
    });
    it('should return error if response is empty from repository', async () => {
      mockBaseRepository.delete.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      const result = await service.delete('id');
      expect(result).toMatchObject(expected);
    });
    it('should return error if nothing deleted from repository', async () => {
      mockBaseRepository.delete.mockResolvedValue({ ok: 0, n: 0 });
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.FAILED_TO_DELETE_RESOURCE, null, 400),
      );
      const result = await service.delete('id');
      expect(result).toMatchObject(expected);
    });
    it('should return error if model to be deleted is not found by id', async () => {
      mockBaseRepository.findById.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.NOT_FOUND, null, 404),
      );
      const result = await service.delete('id');
      expect(result).toMatchObject(expected);
    });
    it('should return error if unhandled error occurs', async () => {
      const expectedError = new Error('error');
      mockBaseRepository.delete.mockRejectedValue(expectedError);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(
          BaseErrors.FAILED_TO_DELETE_RESOURCE,
          null,
          400,
          expectedError,
        ),
      );
      const result = await service.delete('id');
      expect(result).toMatchObject(expected);
      expect(mockLoggerService.error).toBeCalled();
    });
  });

  describe('findById', () => {
    it('should call repository.findById and return result successfully', async () => {
      const result = await service.findById('id');
      expect(mockBaseRepository.findById).toBeCalledWith('id');
      expect(result).toMatchObject({ data: { name: 'foobar' } });
    });
    it('should return error if response is empty from repository', async () => {
      mockBaseRepository.findById.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      const result = await service.findById('id');
      expect(result).toMatchObject(expected);
    });
    it('should return error if unhandled error occurs', async () => {
      const expectedError = new Error('error');
      mockBaseRepository.findById.mockRejectedValue(expectedError);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, null, 400, expectedError),
      );
      const result = await service.findById('id');
      expect(result).toMatchObject(expected);
      expect(mockLoggerService.error).toBeCalled();
    });
  });

  describe('findOne', () => {
    it('should call repository.findOne and return result successfully', async () => {
      const result = await service.findOne({ name: 'foobar' });
      expect(mockBaseRepository.findOne).toBeCalledWith({ name: 'foobar' });
      expect(result).toMatchObject({ data: { name: 'foobar' } });
    });
    it('should return error if response is empty from repository', async () => {
      mockBaseRepository.findOne.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      const result = await service.findOne({ name: 'foobar' });
      expect(result).toMatchObject(expected);
    });
    it('should return error if unhandled error occurs', async () => {
      const expectedError = new Error('error');
      mockBaseRepository.findOne.mockRejectedValue(expectedError);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, null, 400, expectedError),
      );
      const result = await service.findOne({ name: 'foobar' });
      expect(result).toMatchObject(expected);
      expect(mockLoggerService.error).toBeCalled();
    });
  });

  describe('find', () => {
    it('should call repository.find and return result successfully', async () => {
      const result = await service.find(
        { name: 'foobar' },
        { limit: 5, skip: 0 },
      );
      expect(mockBaseRepository.find).toBeCalledWith(
        { name: 'foobar' },
        { limit: 5, skip: 0 },
      );
      expect(result).toMatchObject({
        data: [{ name: 'foobar' }, { name: 'barbaz' }],
      });
    });
    it('should return error if response is empty from repository', async () => {
      mockBaseRepository.find.mockResolvedValue(null);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      const result = await service.find(
        { name: 'foobar' },
        { limit: 5, skip: 0 },
      );
      expect(result).toMatchObject(expected);
    });
    it('should return error if unhandled error occurs', async () => {
      const expectedError = new Error('error');
      mockBaseRepository.find.mockRejectedValue(expectedError);
      const expected = new EntityMetadata(
        undefined,
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, null, 400, expectedError),
      );
      const result = await service.find(
        { name: 'foobar' },
        { limit: 5, skip: 0 },
      );
      expect(result).toMatchObject(expected);
      expect(mockLoggerService.error).toBeCalled();
    });
  });

  describe('getSuccessEntityMetadata', () => {
    it('should return correct structure of entity metadata', () => {
      const result = BaseService.getSuccessEntityMetadata({ name: 'foobar' });
      expect(result).toMatchObject({ data: { name: 'foobar' } });
    });
  });

  describe('getErrorEntityMetadata', () => {
    it('should return result with error and call LoggerService.error', () => {
      const expected = new EntityMetadata(
        null,
        new ErrorInfo(BaseErrors.UNHANDLED_ERROR, 'message', 400),
      );
      const result = service.getErrorEntityMetadata(
        BaseErrors.UNHANDLED_ERROR,
        'message',
        400,
      );
      expect(result).toMatchObject(expected);
    });
  });

  describe('convertToEntityMetadata', () => {
    it('should return result with error if error is not empty', () => {
      const error = new ErrorInfo(BaseErrors.UNHANDLED_ERROR, 'message', 400);
      const data = { name: 'foobar' };
      const expected = new EntityMetadata(null, error);
      const result = service.convertToEntityMetadata(error, data);
      expect(result).toMatchObject(expected);
    });
    it('should return empty response error if data is empty', () => {
      const error = new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400);
      const result = service.convertToEntityMetadata(error);
      const expected = new EntityMetadata(
        null,
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      expect(result).toMatchObject(expected);
    });
    it('should return response with data if error arg is not present', () => {
      const result = service.convertToEntityMetadata(null, { name: 'foobar' });
      const expected = new EntityMetadata({ name: 'foobar' });
      expect(result).toMatchObject(expected);
    });
  });
});
