import Promise from 'bluebird';
import { parse } from 'aws-event-parser';
import { strip } from 'eskimo-stripper';
import querystring from 'querystring';

const s3Client = new AWS.S3({ region: process.env.SERVERLESS_REGION });

// function createDynamoDBStreamRouter(routerFn, concurrency) {
//   return records => Promise.map(records, (record) => {
//     const oldImage = record.dynamodb.OldImage ? strip(record.dynamodb.OldImage) : {};
//     const newImage = record.dynamodb.NewImage ? strip(record.dynamodb.NewImage) : {};
//     return routerFn(record.eventName, { oldImage, newImage });
//   }, concurrency);
// }

// function createDynamoDBStreamProcessor(eventTypeProcessorMapping, concurrency) {
//   return records => Promise.map(records, (record) => {
//     const eventType = record.eventName;
//     const processorFn = eventTypeProcessorMapping[eventType];
//     if (!processorFn) return Promise.resolve();
//     const oldImage = record.dynamodb.OldImage ? strip(record.dynamodb.OldImage) : {};
//     const newImage = record.dynamodb.NewImage ? strip(record.dynamodb.NewImage) : {};
//     return processorFn({ oldImage, newImage });
//   }, concurrency);
// }

// function parseDynamoDBStreamEventGroups(records) {
//   const events = this.parseDynamoDBStreamEvent(records);
//   const deletes = events.filter(event => event.eventName === 'REMOVE');
//   const inserts = events.filter(event => event.eventName === 'INSERT');
//   const updates = events.filter(event => event.eventName === 'MODIFY');
//   return { deletes, inserts, updates };
// }

// function parseDynamoDBStreamEvent(records) {
//   return records.map((record) => {
//     const oldImage = record.dynamodb.OldImage ? strip(record.dynamodb.OldImage) : {};
//     const newImage = record.dynamodb.NewImage ? strip(record.dynamodb.NewImage) : {};
//     return { eventName: record.eventName, oldImage, newImage };
//   });
// }

function parseKinesisStreamEvent(event) {
  return event.Records.map(record => ({
    data: JSON.parse(new Buffer(record.kinesis.data, 'base64').toString()),
    partitionKey: record.kinesis.partitionKey
  }));
}

function createKinesisStreamRouter(routerFn, concurrency) {
  return records => Promise.map(records, record => routerFn(record), concurrency);
}

function parseKinesisStreamTopicEvents(event, topic) {
  return parseKinesisStreamEvent(event).filter(event => event.partitionKey === topic);
}

function parseS3Event(event) {
  const eventData = event.Records[0].s3;
  const bucket = eventData.bucket.name;
  const key = querystring.unescape(eventData.object.key);
  const s3Params = { Bucket: bucket, Key: key };
  return s3Client.getObject(s3Params).promise()
    .then(s3Data => ({
      bucket,
      key,
      body: s3Data.Body.toString('utf8'),
      metadata: s3Data.Metadata
    }));
}

export default {
  // createDynamoDBStreamProcessor,
  // createDynamoDBStreamRouter,
  // createKinesisStreamRouter,
  // parseDynamoDBStreamEventGroups,
  // parseDynamoDBStreamEvent,
  parseKinesisStreamEvent,
  parseKinesisStreamTopicEvents,
  parseS3Event
};
