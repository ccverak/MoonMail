import EventLog from '../EventLog';
import Events from '../Events';

function publishRecipientsBatch(recipientsBatch, startIndex, batchSize, total) {
  const eventsBatch = recipientsBatch.map((recipient, index) => ({
    type: Events.listRecipientImported,
    payoad: {
      recipient,
      totalRecipients: total,
      recipientIndex: startIndex + index
    }
  })).filter(Events.isValid);

  // Duplicating information in event type and topic is on purpose
  // It gives more flexibility to change the sharding strategy and 
  // still being able to route type of messages because each event
  // is self contained.
  // Possible scenarios:
  // 1)
  // topic: recipientCreated (the shard partition key)
  // event type: list.recipientImported
  // 2)
  // topic: list.recipientImported (the shard partition key)
  // event type: list.recipientImported
  return EventLog.batchWrite({
    topic: Events.listRecipientImported,
    streamName: process.env.LIST_RECIPIENT_STREAM_NAME,
    data: eventsBatch
  });
}

export default {
  execute: publishRecipientsBatch
};
