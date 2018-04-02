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


class Job {
  constructor(jobId) {
    this.jobId = jobId;
  }

  static perform(payload, performIn) {
    // from serverless conventions

    const subscriber = this.prototype.constructor.name;
    return schedule(subscriber, subscriberFingerprint, payload, performIn);
  }

  beforeExecution() {

  }

  afterExecution() {
    ScheduledJob.updateFinished(this.jobId);
    // update retries
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
const enqueueForExecution = function enqueueForExecution({ subject, payload }) {
  // build the lambda function name
  return executionStrategy.lambda({ subject, payload });
};

const executeJobs = function executeJobs() {
  return ScheduledJob._client.scan().promise()
    .then(jobs => Promise.map(jobs, (job) => {
      if (job.scheduledAt > moment().unix()) return Promise.resolve();
      return enqueueForExecution({ subject: job.subject, payload: job.payload });
      // updating jobs statuses should be included in the
      // base worker class
    }));
};

// to be used in the subcribed lambda
const executeJob = async function executeJob(event, jobClass) {
  const jobInstance = new jobClass(event.jobId);
  await jobInstance.beforeExecution();
  await jobInstance.perform();
  await jobInstance.afterExecution();
};

