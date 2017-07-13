import { Lambda } from 'aws-sdk';

const lambdaClient = new Lambda({ region: process.env.SERVERLESS_REGION });

export default class FunctionsClient {
  static execute(functionName, payload = {}, options = {}) {
    const inovkationType = options.async ? 'Event' : 'RequestResponse';
    const params = {
      Payload: JSON.stringify(payload),
      FunctionName: functionName,
      InvocationType: inovkationType
    };
    return this.client.invoke(params).promise()
      .then(result => this._handleResponse(result));
  }

  static _handleResponse(lambdaResult) {
    console.log('_handleResponse', JSON.stringify(lambdaResult));
    return this._successfulAWSCall(lambdaResult) ?
      this._parseResults(lambdaResult) : Promise.reject(lambdaResult);
  }

  static _parseResults(lambdaResult) {
    if (this._successfulFunctionResult(lambdaResult)) {
      console.log("_successfulFunctionResult==true");
      return Promise.resolve(JSON.parse(lambdaResult.Payload));
    }
    const err = this._parseFunctionError(lambdaResult.Payload);
    console.log("ERR", err);
    return Promise.reject(err);
  }

  static _parseFunctionError(payload) {
    try {
      return JSON.parse(payload.errorMessage);
    } catch (e) {
      console.log(e);
      return payload;
    }
  }

  static _successfulFunctionResult(lambdaResult) {
    return !lambdaResult.FunctionError;
  }

  static _successfulAWSCall(lambdaResult) {
    const validStatusCodes = [200, 202];
    return validStatusCodes.includes(lambdaResult.StatusCode);
  }

  static get client() {
    return lambdaClient;
  }
}
