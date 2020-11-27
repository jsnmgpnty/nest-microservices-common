# nest-microservices-common
- A NestJS module for `generator-nest-microservices` yeoman template that offers base controller, services and repositories as well as some interceptors and filters
### How to use
- install package with `npm i -S nest-microservices-common`
- Register the `CommonModule` to your feature modules:
```
@Module({})
export class AppModule {
  static register(config: ConfigOptions): DynamicModule {
    return {
      module: AppModule,
      imports: [
        CommonModule.register({ platform: CommonModulePlatform.EXPRESS }),
        ...
      ],
    };
  }
}
```
- Once `CommonModule` is registered, then you can extend the `BaseController`, `BaseService<T>` and `BaseRepository<T>`
```
export class ExampleController extends BaseController<Example, ExampleService> {
  constructor (service: ExampleService, logger: LoggerService) {
    super (service, logger);
  }
}
```