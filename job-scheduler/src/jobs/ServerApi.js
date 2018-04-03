import Promise from 'bluebird';
import moment from 'moment';
import ScheduledJobRepository from './ScheduledJobRepository';
import FunctionsClient from './FunctionsClient';

const executionStrategy = {
  lambda: ({ jobId, subscriber, payload }) => FunctionsClient.execute(subscriber, { jobId, subscriber, payload }, { async: true })
};
const triggerExecution = function triggerExecution({ jobId, subscriber, payload }) {
  // build the lambda function name
  return executionStrategy.lambda({ jobId, subscriber, payload });
};


// Private api to be exposed in a lambda
const findJobsToBeTriggered = function findJobsToBeTriggered() {
  return ScheduledJobRepository.all()
    .then(jobs => Promise.map(jobs, (job) => {
      if (job.scheduledAt > moment().unix()) return Promise.resolve();
      return triggerExecution({ jobId: job.id, subscriber: job.subscriber, payload: job.payload })
        .then(() => ScheduledJobRepository.update({ status: 'triggered' }, job.id));
    }));
};

// Public api to be exposed in a lambda
const scheduleJob = function scheduleJob(subscriber, payload = {}, performIn) {
  return ScheduledJobRepository.create({ subscriber, payload, scheduledAt: moment().add(performIn).unix() });
};

// Public api to be exposed in a lambda
const updateJobStatus = function updateJobStatus(jobId, status) {
  return ScheduledJobRepository.update({ status }, jobId);
};

export default {
  scheduleJob,
  updateJobStatus,
  findJobsToBeTriggered
};
