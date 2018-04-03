import Api from './src/Api';

export function scheduleJob(event, context, callback) {
  return Api.scheduleJob(event.subscriber, event.payload, event.peformIn)
    .then(job => callback(null, { jobId: job.id }))
    .catch(err => callback(err));
}

export function updateJobStatus(event, context, callback) {
  Api.updateJobStatus(event.jobId, event.status)
    .then(job => callback(null, { jobId: job.id }))
    .catch(err => callback(err));
}

export function findJobsToBeTriggered(event, context, callback) {
  Api.findJobsToBeTriggered()
    .then(job => callback(null, { jobId: job.id }))
    .catch(err => callback(err));
}
