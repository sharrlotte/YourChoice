export type EventType = 
  | 'TaskCreated'
  | 'TaskStatusChanged'
  | 'TaskVoted'
  | 'CommentAdded'
  | 'ReactionAdded';

export interface AppEvent {
  type: EventType;
  payload: any;
  timestamp: Date;
}

/**
 * Mock Event Publisher
 * 
 * This is a placeholder implementation for an event-driven architecture.
 * Currently, it logs events to the console. In the future, this can be
 * replaced with a real message queue (e.g., RabbitMQ, Kafka, Redis)
 * or a webhook dispatcher.
 */
export class EventPublisher {
  private static instance: EventPublisher;

  private constructor() {}

  public static getInstance(): EventPublisher {
    if (!EventPublisher.instance) {
      EventPublisher.instance = new EventPublisher();
    }
    return EventPublisher.instance;
  }

  public async publish(type: EventType, payload: any): Promise<void> {
    const event: AppEvent = {
      type,
      payload,
      timestamp: new Date(),
    };

    // Mock implementation: Log to console
    console.log(`[EventPublisher] Published event: ${type}`, JSON.stringify(event, null, 2));

    // In a real implementation, we would send this to a message broker here.
    // await producer.send({ topic: type, messages: [{ value: JSON.stringify(event) }] });
  }
}

export const eventPublisher = EventPublisher.getInstance();
