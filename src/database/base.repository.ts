import { Model, Types, FilterQuery, QueryOptions } from 'mongoose';
import { BaseEntity } from '../models';

const DEFAULT_LIMIT = 15;
const DEFAULT_SKIP = 0;

export class BaseRepository<T extends BaseEntity> {
  protected model: Model<T>;

  constructor(schemaModel: Model<T>) {
    this.model = schemaModel;
  }

  public async create(item: T): Promise<T> {
    return ((await this.model.create(item)).toJSON() as unknown) as T;
  }

  public async getAll(): Promise<T[]> {
    return await this.model.find({}, null, { lean: true });
  }

  public async update(id: string, item: T): Promise<T> {
    const result = await this.model.findByIdAndUpdate(id, item as any, {
      upsert: true,
      new: true,
      lean: true,
    });
    if (!result) throw new Error(`Failed to update entity ${id}`);
    return result;
  }

  public async delete(id: string): Promise<{ ok?: number; n?: number }> {
    return this.model.remove({ _id: BaseRepository.toObjectId(id) });
  }

  public async findById(id: string): Promise<T> {
    return this.model.findById(id, null, { lean: true });
  }

  public async findOne(cond?: object): Promise<T> {
    return this.model.findOne(cond, null, { lean: true });
  }

  public async find(
    cond?: FilterQuery<T>,
    options?: FindModelOptions<T>,
  ): Promise<T[]> {
    const limit = options?.limit || DEFAULT_LIMIT;
    const skip = options?.skip || DEFAULT_SKIP;
    const sort = options?.sort;
    const queryOptions: QueryOptions = { limit, skip, sort, lean: true };
    const result = await this.model.find(cond, null, queryOptions);
    return (result as unknown) as T[];
  }

  static toObjectId(id: string): Types.ObjectId {
    return Types.ObjectId.createFromHexString(id);
  }
}

export type FindModelOptions<T> = {
  limit?: number;
  skip?: number;
  sort?: {
    [field in Exclude<keyof T, keyof Document>]?: number;
  };
};
