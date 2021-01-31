import { Module, OnApplicationBootstrap } from '@nestjs/common';
import {
  CommandBus,
  QueryBus,
  EventPublisher,
} from '@nestjs/cqrs';
import { ExplorerService } from '@nestjs/cqrs/dist/services/explorer.service';
import { NestjsMicroservicesCqrs } from './services';
import { EventBus } from './event-bus';
import { ISerializableEvent } from './serializable';

@Module({
  providers: [CommandBus, QueryBus, EventBus, EventPublisher, ExplorerService, NestjsMicroservicesCqrs],
  exports: [CommandBus, QueryBus, EventBus, EventPublisher],
})
export class NestjsMicroservicesCqrsModule<EventBase extends ISerializableEvent = ISerializableEvent>
  implements OnApplicationBootstrap {
  constructor(
    private readonly explorerService: ExplorerService<EventBase>,
    private readonly eventsBus: EventBus<EventBase>,
    private readonly commandsBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  onApplicationBootstrap() {
    const { events, queries, sagas, commands } = this.explorerService.explore();

    this.eventsBus.register(events);
    this.commandsBus.register(commands);
    this.queryBus.register(queries);
    this.eventsBus.registerSagas(sagas);
  }
}
