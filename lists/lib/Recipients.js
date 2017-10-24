import AWS from 'aws-sdk';
import querystring from 'querystring';
import ImportRecipientsCsv from './recipients/ImportRecipientsCsv';
import { configureLogger, logger } from './index';

const s3Client = new AWS.S3({ region: process.env.SERVERLESS_REGION });
const lambdaClient = new AWS.Lambda();

function importRecipientsCsvFromS3(event, context, callback) {
  configureLogger(event, context);
  logger().info('importRecipientsCsvFromS3', JSON.stringify(event));

  const eventData = event.Records[0].s3;
  const bucket = eventData.bucket.name;
  const fileKey = querystring.unescape(eventData.object.key);
  const fileTokens = fileKey.split('.');
  const userId = fileTokens[0];
  const listId = fileTokens[1];

  const s3Params = { Bucket: bucket, Key: fileKey };

  const buildImportRecipientParams = s3Data => ({
    userId,
    listId,
    body: s3Data.Body.toString('utf8'),
    metadataMapping: s3Data.Metadata.headers,
    processingOffset: event.processingOffset || 0
  });

  return s3Client.getObject(s3Params).promise()
    .then(data => ImportRecipientsCsv.execute(buildImportRecipientParams(userId, listId, data, event), lambdaClient, context))
    .then(result => callback(null, result))
    .catch((err) => {
      logger().error(err);
      callback(err);
    });
}

export default {
  importRecipientsCsvFromS3
};

