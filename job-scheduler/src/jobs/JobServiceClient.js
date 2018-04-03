import FunctionsClient from './FunctionsClient';

const scheduleJob = function scheduleJob(subscriber, payload, performIn) {
  const functionName = process.env.JOBS_SERVICE__SCHEDULE_JOB_FUNCTION_NAME || 'somehting hardcoded here';
  return FunctionsClient.execute(functionName, { subscriber, payload, performIn });
};

const updateJobStatus = function updateJobStatus(jobId, status) {
  const functionName = process.env.JOBS_SERVICE__UPDATE_JOB_STATUS_FUNCTION_NAME || 'somehting hardcoded here';
  return FunctionsClient.execute(functionName, { jobId, status });
};

export default {
  scheduleJob,
  updateJobStatus
};
