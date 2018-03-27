import Promise from 'bluebird';
import moment from 'moment';
import uuidv4 from 'uuid/v4';
import { BaseModel } from 'moonmail-models';

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
    return schedule(this.prototype.constructor.name, payload, performIn);
  }
}

const schedule = function schedule(subject, payload = {}, performIn = moment.duration(1, 'second')) {
  return ScheduledJob.create({ id: uuidv4(), subject, payload, scheduledAt: moment().add(performIn).unix() });
};

const execute = function execute({ subject, payload }) {
  const Ctor = eval(subject);
  return new Ctor().perform(payload);
};

const executeJobs = function executeJobs() {
  return ScheduledJob._client.scan().promise()
    .then(jobs => Promise.map(jobs, (job) => {
      if (job.scheduledAt > moment().unix()) return Promise.resolve();
      return execute({ subject: job.subject, payload: job.payload })
        .then(ScheduledJob.delete(job.id));
    }));
};

