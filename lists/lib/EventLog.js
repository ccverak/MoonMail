import AWS from 'aws-sdk';
import logger from './index';
import retry from 'bluebird-retry';

function buildKinesisParams(partitionKey, streamName, payload) {
  if (Object.keys(payload).length === 0) return Promise.resolve({});
  return {
    Data: JSON.stringify(payload),
    PartitionKey: partitionKey,
    StreamName: streamName
  };
}

// TODO: Add event validation
function publishKinesisEvent(partitionKey, streamName, payload, kinesisClient = null) {
  const params = buildKinesisParams(partitionKey, streamName, payload);
  logger().debug('= publishKinesisEvent', JSON.stringify(params));
  const client = Object.assign({}, new AWS.Kinesis({ region: process.env.SERVERLESS_REGION }), kinesisClient);
  return retry(client.putRecord(params).promise(), { max_tries: 10, interval: 50, backoff: 2 });
}

function publishKinesisEvents(partitionKey, streamName, events, kinesisClient = null) {
  const paramList = events.map(e => buildKinesisParams(partitionKey, streamName, e));
  logger().debug('= publishKinesisEvent', JSON.stringify(paramList));
  const client = Object.assign({}, new AWS.Kinesis({ region: process.env.SERVERLESS_REGION }), kinesisClient);
  return retry(client.putRecords(paramList).promise(), { max_tries: 10, interval: 50, backoff: 2 });
}

function write({ topic, streamName, payload }) {
  return publishKinesisEvent(topic, streamName, payload);
}

function batchWrite({ topic, streamName, data }) {
  return publishKinesisEvents(topic, streamName, data);
}

export default {
  write,
  batchWrite
};
