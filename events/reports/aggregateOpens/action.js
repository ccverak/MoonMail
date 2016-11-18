'use strict';

import { OpenReport } from 'moonmail-models';
import { debug } from '../../lib/index';
import { strip } from 'eskimo-stripper';
import { TimeAggregatorService } from '../../time_aggregator_service';

export function respond(event, cb) {
  debug('= aggregateOpens.action', JSON.stringify(event));
  const records = strip(event.Records);

  const aggregatedData = TimeAggregatorService.aggregate(records, [15, 'm'], {
    groupByAttrs: ['campaignId'],
    eventName: 'count'
  });

  return OpenReport.saveAll(aggregatedData)
    .then(() => cb(null, true))
    .catch(err => cb(err));
}
