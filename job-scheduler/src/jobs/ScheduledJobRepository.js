import moment from 'moment';
import Joi from 'joi';
import uuidv4 from 'uuid/v4';
import { BaseModel } from 'moonmail-models';

export default class ScheduledJobRepository extends BaseModel {
  static tableName() {
    return process.env.SCHEDULED_JOBS_TABLE;
  }

  static get createSchema() {
    return Joi.object({
      id: Joi.string().default(uuidv4()),
      payload: Joi.object(),
      createdAt: Joi.number().default(moment().unix())
    });
  }

  static get hashKey() {
    return 'id';
  }

  static create(item) {
    return super.create(item, { allowUnknown: true });
  }

  static all() {
    return this._client('scan', { TableName: this.tableName });
  }
}
