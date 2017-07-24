import omitEmpty from 'omit-empty';
import { logger } from '../../lib/index';
import FunctionsClient from '../../lib/functions_client';
import decrypt from '../../lib/auth-token-decryptor';
import { paramsChecker, errorHandler, newError } from '../../lib/api-utils';

export default function respond(event, cb) {
  logger().info('= searchRecipientsHttp.action', JSON.stringify(event));
  const checkParams = paramsChecker(['authToken', 'conditions']);
  return checkParams(omitEmpty(event))
    .then(params => decrypt(params.authToken))
    .then(decoded => searchRecipients(event))
    .then(results => cb(null, results))
    .catch((err) => {
      logger().error(err);
      // Even search is based upon segments
      if (err.name === 'ListSegmentError') {
        return errorHandler(newError('ConditionsFormatError', err.message, 401), { customErrorNames: ['ConditionsFormatError'] }, cb);
      }
      return errorHandler(err, [], cb);
    });
}

function searchRecipients(event) {
  return FunctionsClient.execute(process.env.SEARCH_RECIPIENTS_FUNCTION, event);
}
