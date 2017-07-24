import 'babel-polyfill';

export const errors = {
  InvalidToken: newError('InvalidToken', 'Missing or invalid JWT', 401),
  MissingParams: newError('MissingParams', 'Missing parameters', 401),
  WrongParams: newError('WrongParams', 'The provided parameters are invalid', 401),
  NotAuthorized: newError('NotAuthorized', 'You are not authorized to perform this action', 403),
  ServiceUnavailable: newError('ServiceUnavailable', 'Upstream service is unavailable', 503)
};

export function newError(name, message, status = 500) {
  const err = new Error(message);
  err.name = name;
  err.status = status;
  Object.defineProperty(err, 'toJSON', {
    value: () => ({ message, status, name }),
    configurable: true,
    writable: true
  });
  return err;
}

export function paramsChecker(requiredParams) {
  return (params = {}) => new Promise((resolve, reject) => {
    const paramKeys = Object.keys(params);
    const hasAllParams = requiredParams.every(param => paramKeys.includes(param));
    return hasAllParams ? resolve(params) : reject(errors.MissingParams);
  });
}

export function errorHandler(err, { customErrorNames = [] }, cb) {
  console.log('errorHandler', err, customErrorNames);
  const handledErrorNames = Object.keys(errors).concat(customErrorNames);
  if (handledErrorNames.includes(err.name)) return cb(JSON.stringify(err));
  return cb(JSON.stringify(errors.ServiceUnavailable));
}
