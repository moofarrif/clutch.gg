import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBusService } from '../common/events/event-bus.service';
import { MatchResultConfirmedEvent } from '../common/events/match-events';
import { EloProducer } from './elo.producer';

@Injectable()
export class EloListener implements OnModuleInit {
  private readonly logger = new Logger(EloListener.name);

  constructor(
    @Inject(EventBusService) private readonly eventBus: EventBusService,
    private readonly eloProducer: EloProducer,
  ) {}

  onModuleInit() {
    this.eventBus.on('match.result.confirmed', (event: MatchResultConfirmedEvent) => {
      this.logger.log(`Match result confirmed: ${event.matchId} → ${event.result}`);
      this.eloProducer.addEloJob(event.matchId, event.result);
    });
  }
}
