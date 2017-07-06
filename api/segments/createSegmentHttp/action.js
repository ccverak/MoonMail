import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import FunctionsClient from '../../lib/functions_client';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler, newErrorFromPayload } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= createSegmentHttp.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'segment']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => createSegment(decoded.sub, event.listId, event))
    .then(segment => cb(null, segment))
    .catch((err) => {
      logger().error(err);
      error = newErrorFromPayload(payload, 'ListSegment', 402);
      return errorHandler(error, [], cb);
    });
}

function createSegment(userId, listId, event) {
  const segment = Object.assign({}, { userId, listId }, event.segment);
  return FunctionsClient.execute(process.env.CREATE_SEGMENT_FUNCTION, { segment });
}
