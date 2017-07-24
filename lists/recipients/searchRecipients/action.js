import { logger } from '../../lib/index';
import Segments from '../../lib/segments/index';

export default function respond(event, cb) {
  logger().info('= searchRecipients.action', JSON.stringify(event));
  const options = event.options || {};
  return Segments.listSegmentMembersByListAndConditions(event.listId, event.conditions, options.from || 0, options.size || 10)
    .then(members => cb(null, members))
    .catch((err) => {
      logger().error(err, err);
      return cb(JSON.stringify(err));
    });
}
