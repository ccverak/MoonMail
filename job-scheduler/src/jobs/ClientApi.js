import moment from 'moment';
import JobServiceClient from './JobServiceClient';

export const scheduleJob = async function scheduleJob(subscriber, payload, performIn = moment.duration(1, 'second')) {
  console.log(`JobId:${this.jobId} started`);
  const { jobId } = await JobServiceClient.scheduleJob(subscriber, payload, performIn);
  console.log(`JobId:${this.jobId} fnished`);
  return jobId;
};

export const executeJob = function executeJob(event, context, executeFn) {
  return executeFn(event.payload)
    .catch((error) => {
      console.error(error);
      return JobServiceClient.updateJobStatus(event.jobId, { status: 'error' });
    })
    .then(() => JobServiceClient.updateJobStatus(event.jobId, 'success'));
};
