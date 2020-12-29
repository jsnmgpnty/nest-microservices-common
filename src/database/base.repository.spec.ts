import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { BaseEntity } from '../models';
import { BaseRepository } from '../database/base.repository';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

type TestClass = TestClassEntity & BaseEntity;

class TestClassEntity {
  name: String;
}

@Injectable()
class TestRepository extends BaseRepository<TestClass> {
  constructor(@InjectModel(TestClassEntity.name) model: Model<TestClass>) {
    super(model);
  }
}

describe('Baserepository', () => {
  let repositoryModel;
  const modelData1 = { name: 'foobar' };
  const modelData2 = { name: 'barbaz' };
  let repository: TestRepository;

  beforeEach(async () => {
    repositoryModel = {
      create: jest.fn().mockResolvedValue({ toJSON: () => modelData1 }),
      find: jest.fn().mockResolvedValue([modelData1, modelData2]),
      findByIdAndUpdate: jest.fn().mockResolvedValue(modelData1),
      remove: jest.fn().mockResolvedValue({ ok: 1, n: 1 }),
      findById: jest.fn().mockResolvedValue(modelData1),
      findOne: jest.fn().mockResolvedValue(modelData1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestRepository,
        {
          provide: getModelToken(TestClassEntity.name),
          useValue: repositoryModel,
        },
      ],
    }).compile();

    repository = module.get<TestRepository>(TestRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(repository).toBeDefined();
    });
  });

  describe('create', () => {
    it('should call model.create and return result successfully', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const result = await repository.create(param as TestClass);
      expect(repositoryModel.create).toBeCalledWith(param);
      expect(result).toMatchObject(modelData1);
    });
  });

  describe('getAll', () => {
    it('should call model.getAll and return result successfully', async () => {
      const result = await repository.getAll();
      expect(repositoryModel.find).toBeCalledWith({}, null, { lean: true });
      expect(result).toMatchObject([modelData1, modelData2]);
    });
  });

  describe('update', () => {
    it('should call model.findByIdAndUpdate and return result successfully', async () => {
      const param: TestClassEntity = { name: 'foobar' };
      const result = await repository.update('id', param as TestClass);
      expect(repositoryModel.findByIdAndUpdate).toBeCalledWith('id', param, {
        upsert: true,
        new: true,
        lean: true,
      });
      expect(result).toMatchObject(modelData1);
    });
    it('should throw error if findByIdAndUpdate returns empty result', async () => {
      repositoryModel.findByIdAndUpdate.mockResolvedValue(null);
      const param: TestClassEntity = { name: 'foobar' };
      try {
        await repository.update('id', param as TestClass);
      } catch (error) {
        const expectedError = new Error('Failed to update entity id');
        expect(error).toMatchObject(expectedError);
      }
    });
  });

  describe('delete', () => {
    it('should call model.remove and return result successfully', async () => {
      const expectedParam = {
        _id: BaseRepository.toObjectId('5fe9b14943c3fd78018530ac'),
      };
      const result = await repository.delete('5fe9b14943c3fd78018530ac');
      expect(repositoryModel.remove).toBeCalledWith(expectedParam);
      expect(result).toMatchObject({ ok: 1, n: 1 });
    });
  });

  describe('findById', () => {
    it('should call model.findById and return result successfully', async () => {
      const result = await repository.findById('id');
      expect(repositoryModel.findById).toBeCalledWith('id', null, {
        lean: true,
      });
      expect(result).toMatchObject(modelData1);
    });
  });

  describe('findOne', () => {
    it('should call model.findOne and return result successfully', async () => {
      const result = await repository.findOne({ name: 'foobar' });
      expect(repositoryModel.findOne).toBeCalledWith({ name: 'foobar' }, null, {
        lean: true,
      });
      expect(result).toMatchObject(modelData1);
    });
  });

  describe('find', () => {
    it('should call model.find with defaults if options not defined and return result successfully', async () => {
      const result = await repository.find({}, null);
      expect(repositoryModel.find).toBeCalledWith({}, null, {
        limit: 15,
        skip: 0,
        sort: undefined,
        lean: true,
      });
      expect(result).toMatchObject([modelData1, modelData2]);
    });
    it('should call model.find with defaults and return result successfully', async () => {
      const result = await repository.find({}, { limit: 100, skip: 20 });
      expect(repositoryModel.find).toBeCalledWith({}, null, {
        limit: 100,
        skip: 20,
        sort: undefined,
        lean: true,
      });
      expect(result).toMatchObject([modelData1, modelData2]);
    });
  });

  describe('toObjectId', () => {
    it('should return correct structure of entity metadata', () => {
      const result = BaseRepository.toObjectId('5fe9b14943c3fd78018530ac');
      console.log(result);
      expect(result).toBeDefined();
    });
  });
});
