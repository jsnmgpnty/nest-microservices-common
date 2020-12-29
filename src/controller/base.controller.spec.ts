import { Injectable } from '@nestjs/common';
import { Prop } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterQuery } from 'mongoose';
import { BaseRepository, FindModelOptions } from '../database/base.repository';
import {
  AppException,
  BaseEntity,
  BaseErrors,
  EntityMetadata,
  ErrorInfo,
} from '../models';
import { BaseService } from '../services/base.service';
import { BaseController } from './base.controller';

type TestClass = TestClassEntity & BaseEntity;

class TestClassEntity {
  @Prop()
  name: String;
}
class TestRepository extends BaseRepository<TestClass> {}

@Injectable()
class TestService extends BaseService<TestClass, TestRepository> {}

@Injectable()
class TestController extends BaseController<
  TestClass,
  TestRepository,
  TestService
> {
  constructor(service: TestService) {
    super(service);
  }

  async find(queryString?: string): Promise<EntityMetadata<TestClass[]>> {
    return super.find(queryString);
  }

  async findById(id: string): Promise<EntityMetadata<TestClass>> {
    return super.findById(id);
  }

  async findOne(queryString: string): Promise<EntityMetadata<TestClass>> {
    return super.findOne(queryString);
  }

  async create(model: TestClass): Promise<EntityMetadata<TestClass>> {
    return super.create(model);
  }

  async update(
    model: TestClass,
    id: string,
  ): Promise<EntityMetadata<TestClass>> {
    return super.update(model, id);
  }

  async delete(id: string): Promise<EntityMetadata<boolean>> {
    return super.delete(id);
  }
}

describe('BaseController', () => {
  interface MockBaseService {
    create: jest.Mock<Promise<EntityMetadata<TestClass>>, [TestClass]>;
    update: jest.Mock<Promise<EntityMetadata<TestClass>>, [string, TestClass]>;
    delete: jest.Mock<Promise<EntityMetadata<boolean>>, [string]>;
    find: jest.Mock<
      Promise<EntityMetadata<TestClass[]>>,
      [FilterQuery<TestClass>, FindModelOptions<TestClass>]
    >;
    findById: jest.Mock<Promise<EntityMetadata<TestClass>>, [string]>;
    findOne: jest.Mock<Promise<EntityMetadata<TestClass>>, [object]>;
  }

  let mockBaseService: MockBaseService;
  let controller: TestController;

  beforeEach(async () => {
    mockBaseService = {
      create: jest.fn().mockResolvedValue({ data: { name: 'foobar' } }),
      update: jest.fn().mockResolvedValue({ data: { name: 'foobar' } }),
      delete: jest.fn().mockResolvedValue({ data: true }),
      find: jest
        .fn()
        .mockResolvedValue({ data: [{ name: 'foobar' }, { name: 'barbaz' }] }),
      findById: jest.fn().mockResolvedValue({ data: { name: 'foobar' } }),
      findOne: jest.fn().mockResolvedValue({ data: { name: 'foobar' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: TestService,
          useValue: mockBaseService,
        },
      ],
    }).compile();

    controller = module.get<TestController>(TestController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('find', () => {
    it('should call service.find with empty arguments if query is null', async () => {
      await controller.find();
      expect(mockBaseService.find).toBeCalledWith(null, null);
    });
    it('should return error if query is not correctly formatted', async () => {
      const expectedError = new AppException(
        new ErrorInfo(BaseErrors.INVALID_ARGUMENTS, null, 400),
      );
      try {
        await controller.find('{ "foobar": "baz" }');
      } catch (error) {
        expect(error).toMatchObject(expectedError);
      }
    });
    it('should call service.find with query and options and return response', async () => {
      const param = { filter: { name: 'foobar' }, limit: 10, skip: 0 };
      const response = await controller.find(JSON.stringify(param));
      const expected = { data: [{ name: 'foobar' }, { name: 'barbaz' }] };
      expect(response).toMatchObject(expected);
      expect(mockBaseService.find).toBeCalledWith(param.filter, {
        limit: 10,
        skip: 0,
        sort: undefined,
      });
    });
  });

  describe('findById', () => {
    it('should call service.find', async () => {
      await controller.findById('id');
      expect(mockBaseService.findById).toBeCalledWith('id');
    });
  });

  describe('findOne', () => {
    it('should return error if query is not correctly formatted', async () => {
      const expectedError = new AppException(
        new ErrorInfo(BaseErrors.INVALID_ARGUMENTS, null, 400),
      );
      try {
        await controller.findOne('{ "foobar": "baz" }');
      } catch (error) {
        expect(error).toMatchObject(expectedError);
      }
    });
    it('should call service.findOne with query and return response', async () => {
      const param = { filter: { name: 'foobar' } };
      const response = await controller.findOne(JSON.stringify(param));
      const expected = { data: { name: 'foobar' } };
      expect(response).toMatchObject(expected);
      expect(mockBaseService.findOne).toBeCalledWith(param.filter);
    });
  });

  describe('create', () => {
    it('should return error if model is empty', async () => {
      const expectedError = new AppException(
        new ErrorInfo(BaseErrors.INVALID_ARGUMENTS, null, 400),
      );
      try {
        await controller.create(null);
      } catch (error) {
        expect(error).toMatchObject(expectedError);
      }
    });
    it('should call service.create and return response', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const response = await controller.create(param as TestClass);
      const expected = { data: { name: 'foobar' } };
      expect(response).toMatchObject(expected);
      expect(mockBaseService.create).toBeCalledWith(param);
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const expected = { data: { name: 'foobar' } };
      const result = await controller.update(param as TestClass, 'id');
      expect(mockBaseService.update).toBeCalledWith('id', param);
      expect(result).toMatchObject(expected);
    });
  });

  describe('delete', () => {
    it('should return error if model to be deleted is not found', async () => {
      const expectedError = new AppException(
        new ErrorInfo(BaseErrors.NOT_FOUND, null, 404),
      );
      try {
        await controller.delete('id');
      } catch (error) {
        expect(error).toMatchObject(expectedError);
      }
    });
    it('should call service.delete and return response', async () => {
      const result = await controller.delete('id');
      expect(mockBaseService.delete).toBeCalledWith('id');
      expect(result).toMatchObject({ data: true });
    });
  });

  describe('sendErrorResponse', () => {
    it('should throw AppException error', async () => {
      const errorInfo = new ErrorInfo(BaseErrors.UNHANDLED_ERROR, null, 500);
      const expectedError = new AppException(errorInfo);
      try {
        BaseController.sendErrorResponse(errorInfo);
      } catch (error) {
        expect(error).toMatchObject(expectedError);
      }
    });
  });

  describe('handleResponse', () => {
    it('should return EMPTY_RESPONSE error if response is empty', async () => {
      const expectedError = new AppException(
        new ErrorInfo(BaseErrors.EMPTY_RESPONSE, null, 400),
      );
      try {
        BaseController.handleResponse(null);
      } catch (error) {
        expect(error).toMatchObject(expectedError);
      }
    });
    it('should return error if error object is present', async () => {
      const errorInfo = new ErrorInfo(BaseErrors.UNHANDLED_ERROR, null, 500);
      const expectedError = new AppException(errorInfo);
      try {
        BaseController.handleResponse(new EntityMetadata(null, errorInfo));
      } catch (error) {
        expect(error).toMatchObject(expectedError);
      }
    });

    it('should return response with data', async () => {
      const result = await BaseController.handleResponse(
        new EntityMetadata({ name: 'foobar' }),
      );
      expect(result).toMatchObject({ data: { name: 'foobar' } });
    });
  });
});
