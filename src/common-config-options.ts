export interface CommonConfigOptions {
  platform: CommonModulePlatform;
}

export enum CommonModulePlatform {
  EXPRESS = 'express',
  FASTIFY = 'fastify',
}
