<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/dm/@nestjs/core.svg" alt="NPM Downloads" /></a>
<a href="https://travis-ci.org/nestjs/nest"><img src="https://api.travis-ci.org/nestjs/nest.svg?branch=master" alt="Travis" /></a>
<a href="https://travis-ci.org/nestjs/nest"><img src="https://img.shields.io/travis/nestjs/nest/master.svg?label=linux" alt="Linux" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#5" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec"><img src="https://img.shields.io/badge/Donate-PayPal-dc3d53.svg"/></a>
  <a href="https://twitter.com/nestframework"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# nestjs-microservices-cqrs

## Description

#### NestJS Microservices CQRS
NestJS Microservices CQRS - Modified CQRS module to subscribe/publish Events globally instead of locally

##### How It Works?

Overriding `@nestjs/cqrs` module, its `EventBus` is changed in order to subscribe to events globally 
when registering `Handlers`.

Publishing `Events` will emit them instead of executing their corresponding handlers.

By default, any `Event` to which at least one `Handler` is registered, will be subscribed `Globally`.

Also, `publish` method of this module's `EventBus` will publish the `Event` globally, and not locally.

Therefore, the `Handler` will be executed after we received the `Event` from the network.


## Installation

```bash
$ npm install --save @melkonline/nestjs-microservices-cqrs
```

## Quick Start

#### In your main.ts:

```TypeScript
import { NestjsMicroservicesCqrs } from "@melkonline/nestjs-microservices-cqrs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice(app.get(NestjsMicroservicesCqrs).init(microserviceConfig), {
    inheritAppConfig: true,
  });
  await app.startAllMicroservices();
  app.get(NestjsMicroservicesCqrs).run();
  app.listen(3456);
}
bootstrap();
```

#### In your app.module.ts:

```TypeScript
import { NestjsMicroservicesCqrsModule } from '@melkonline/nestjs-microservices-cqrs';

@Module({
  imports: [
      /** All other modules */
      NestjsMicroservicesCqrsModule
  ],
  controllers: [/* ...Controllers */],
  providers: [
      /**
        ...Services
        ...CommandHandlers
        ...EventHandlers
       */
  ],
})
export class AppModule {}
```

#### In your `Event`:

```TypeScript
import { SerializableEvent, ISerializableEvent } from '@melkonline/nestjs-microservices-cqrs';

export class TaskCreatedEvent extends SerializableEvent implements ISerializableEvent {
  constructor(public readonly createTaskDto: CreateTaskDto) {
    super();
  }
}
```

#### Using `EventBus`:

```TypeScript
import { EventBus } from '@melkonline/nestjs-microservices-cqrs';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly eventBus: EventBus,
  ) {}

  @Get('test')
  test() {
    const data = new CreateTaskDto();
    data.type = 'testing the module';
    return this.eventBus.publish(new TaskCreatedEvent(data));
  }
}
```

#### Still Want `local` Events?

Simply add `@LocalEvent()` decorator to your `Event` class.

```TypeScript
import { LocalEvent } from '@melkonline/nestjs-microservices-cqrs';

@LocalEvent()
export class TaskCreatedEvent implements IEvent {
  constructor(public readonly data: CreateTaskDto) {}
}
```

Such events will be neither subscribed, nor published globally, instead they will work locally as traditional.

#### Microservice Route Is Also Available:

Beside subscribing to the `Event` via `Handler`, you still can subscribe as a route via `@EventPattern()` 
decorator as traditional:

```TypeScript
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly eventBus: EventBus,
  ) {}

  @EventPattern('TaskCreatedEvent')
  someOtherWayToHandleOurEvent(@Payload() message) {
    console.log('someOtherWayToHandleOurEvent', message);
  }
}
```

## License

NestJS Microservices CQRS [MIT licensed](LICENSE).


