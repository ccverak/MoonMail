import AWS from 'aws-sdk';
import logger from './index';

// TODO: Add event validation
function publishKinesisEvent(partitionKey, streamName, payload, kinesisClient = null) {
  if (Object.keys(payload).length === 0) return Promise.resolve({});
  const params = {
    Data: JSON.stringify(payload),
    PartitionKey: partitionKey,
    StreamName: streamName
  };
  logger().debug('= publishKinesisEvent', JSON.stringify(params));
  const client = Object.assign({}, new AWS.Kinesis({ region: process.env.SERVERLESS_REGION }), kinesisClient);
  return client.putRecord(params).promise();
}

function write({ topic = null, streamName = null, payload = {} }) {
  return publishKinesisEvent(topic, streamName, payload);
}

export default {
  write
};
