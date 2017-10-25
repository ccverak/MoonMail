import AWS from 'aws-sdk';
import ImportRecipientsCsv from './recipients/ImportRecipientsCsv';
import SaveRecipientsBatch from './recipients/SaveRecipientsBatch';
import LambdaUtils from './LambdaUtils';

import Events from './Events';

import { configureLogger, logger } from './index';

const lambdaClient = new AWS.Lambda();

function buildImportRecipientsParams(s3Data, event) {
  const fileKey = s3Data.key;
  const fileTokens = fileKey.split('.');
  return {
    userId: fileTokens[0],
    listId: fileTokens[1],
    body: s3Data.body,
    metadataMapping: s3Data.metadata.headers,
    processingOffset: event.processingOffset || 0
  };
}

function importRecipientsCsvFromS3(event, context, callback) {
  configureLogger(event, context);
  logger().info('importRecipientsCsvFromS3', JSON.stringify(event));

  return LambdaUtils.parseS3Event(event)
    .then(s3Data => buildImportRecipientsParams(s3Data, event))
    .then(importRecipientParams => ImportRecipientsCsv.execute(importRecipientParams, lambdaClient, context))
    .then(result => callback(null, result))
    .catch((err) => {
      logger().error(err);
      callback(err);
    });
}


function recipientImportedHandler(event, context, callback) {
  configureLogger(event, context);
  logger().info('recipientImportedHandler', JSON.stringify(event));

  const recipients = LambdaUtils
    .parseKinesisStreamTopicEvents(event, Events.listRecipientImported)
    .map(Events.isValid);

  return SaveRecipientsBatch.execute(recipients)
    .then(result => callback(null, result))
    .catch((err) => {
      logger().error(err);
      callback(err);
    });
}

export default {
  importRecipientsCsvFromS3,
  recipientImportedHandler
};

