import Promise from 'bluebird';
import moment from 'moment';
import uuidv4 from 'uuid/v4';
import { BaseModel } from 'moonmail-models';
import { exec } from 'child_process';

class ScheduledJob extends BaseModel {
  static tableName() {
    return process.env.SCHEDULED_JOBS_TABLE;
  }

  static get hashKey() {
    return 'id';
  }
}


class Worker {
  static perform(payload, performIn) {
    // from serverless conventions

    const subscriber = this.prototype.constructor.name;
    return schedule(subscriber, subscriberFingerprint, payload, performIn);
  }
}

const schedule = function schedule(subject, payload = {}, performIn = moment.duration(1, 'second')) {
  return ScheduledJob.create({ id: uuidv4(), subject, payload, scheduledAt: moment().add(performIn).unix() });
};

const executionStrategy = {
  local: ({ subject, payload }) => {
    const Ctor = eval(subject);
    return new Ctor().perform(payload);
  },
  lambda: ({ subject, payload }) => {
    const resourceName = `${process.env.SERVICE_NAME}-${process.env.SERVICE_STAGE}-${subject}`;
    // call a lambda
  },
  sqs: ({ subject, payload }) => {

  },
  sns: ({ subject, payload }) => {

  }
};
const execute = function execute({ subject, payload }) {
  // build the lambda function name
  return executionStrategy.lambda({ subject, payload });
};

const executeJobs = function executeJobs() {
  return ScheduledJob._client.scan().promise()
    .then(jobs => Promise.map(jobs, (job) => {
      if (job.scheduledAt > moment().unix()) return Promise.resolve();
      return execute({ subject: job.subject, payload: job.payload });
      // updating jobs statuses should be included in the
      // base worker class
    }));
};

