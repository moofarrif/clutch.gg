import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class EventBusService extends EventEmitter {
  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}
