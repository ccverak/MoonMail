import * as async from 'async';
import Promise from 'bluebird';
import base64url from 'base64-url';
import { Recipient } from 'moonmail-models';
import FunctionsClient from './functions_client';
import { debug } from './index';


class AttachSegmentMembersService {
  constructor(snsClient, attachRecipientsListMessage, lambdaClient, context) {
    this.snsClient = snsClient;
    this.attachRecipientsListMessage = attachRecipientsListMessage;
    const segmentGIdObject = JSON.parse(base64url.decode(attachRecipientsListMessage.segmentGId));
    this.lambdaClient = lambdaClient;
    this.lambdaName = context.functionName;
    this.context = context;
    this.listId = segmentGIdObject.listId;
    this.segmentId = segmentGIdObject.segmentId;
  }

  get executionThreshold() {
    return 60000;
  }

  get batchSize() {
    return 250;
  }

  attachRecipients(nextPage = 0) {
    debug('= AttachSegmentMembersService.attachRecipientsList', this.listId, this.segmentId, nextPage);
    return this._attachRecipientsBatch(nextPage)
      .then(nextPage => this._attachNextBatch(nextPage));
  }

  _attachRecipientsBatch(options = {}) {
    debug('= AttachSegmentMembersService._attachRecipientsBatch', this.listId, this.segmentId, JSON.stringify(options));
    return this._getRecipientsBatch(options)
      .then((result) => {
        if (result.nextPage) {
          next.page = result.nextPage;
        }
        return this._publishRecipients(result.items)
      });
  }

  _attachNextBatch(listId, next) {
    return new Promise((resolve, reject) => {
      if (next && next.hasOwnProperty('page')) {
        if (this._timeEnough()) {
          debug('= AttachSegmentMembersService._attachNextBatch', 'Attaching next batch', JSON.stringify(next));
          resolve(this.attachRecipientsList(next));
        } else {
          debug('= AttachSegmentMembersService._attachNextBatch', 'Not time enough for next batch, invoking lambda...');
          return this._invokeLambda(next);
        }
      } else {
        debug('= AttachSegmentMembersService._attachNextBatch', 'No more batches');
        resolve(true);
      }
    });
  }

  _getRecipientsBatch(options = {}) {
    debug('= AttachSegmentMembersService._getRecipientsBatch', `Getting recipients for listId: ${this.listId}, segmentId: ${this.segmentId}`);
    return FunctionsClient.execute(process.env.LIST_SEGMENT_MEMBERS_FUNCTION, {
      listId: this.listId,
      segmentId: this.segmentId,
      options: {
        conditions: [
          { condition: { queryType: 'match', fieldToQuery: 'status', searchTerm: 'subscribed' }, conditionType: 'filter' }
        ]
      }
    }).then(response => response.total);
  }

  _publishRecipients(recipients) {
    debug('= AttachSegmentMembersService._publishRecipients', 'Publishing a batch of recipients');
    return new Promise((resolve) => {
      async.each(recipients, (recipient, cb) => {
        this._publishRecipient(recipient)
          .then(() => cb())
          .catch((err) => {
            debug('= AttachSegmentMembersService._publishRecipients',
              'Couldn\'t publish recipient', JSON.stringify(recipient), err);
            cb();
          });
      }, () => resolve(true));
    });
  }

  _publishRecipient(recipient) {
    const recipientMessage = this._buildRecipientMessage(recipient);
    debug('= AttachSegmentMembersService._publishRecipient', JSON.stringify(recipientMessage));
    const params = {
      TopicArn: process.env.PRECOMPILE_EMAIL_TOPIC_ARN,
      Message: JSON.stringify(recipientMessage)
    };
    this.snsClient.publish).promise();
  }

  _invokeLambda(nextPage) {
    return new Promise((resolve, reject) => {
      debug('= AttachSegmentMembersService._invokeLambda', 'Invoking function again', this.lambdaName);
      const payload = {
        Records: [{
          Sns: {
            Message: {
              sender: this.attachRecipientsListMessage.sender,
              campaign: this.attachRecipientsListMessage.campaign,
              userId: this.attachRecipientsListMessage.userId,
              userPlan: this.attachRecipientsListMessage.userPlan,
              listId: this.listId
            }
          }
        }],
        batchOffset: nextPage
      };
      debug('= AttachSegmentMembersService._invokeLambda', 'Payload', JSON.stringify(payload));
      const params = {
        FunctionName: this.lambdaName,
        InvocationType: 'Event',
        Payload: JSON.stringify(payload)
      };
      this.lambdaClient.invoke(params, (err, data) => {
        if (err) {
          debug('= AttachSegmentMembersService._invokeLambda', 'Error invoking lambda', err, err.stack);
          reject(err);
        } else {
          debug('= AttachSegmentMembersService._invokeLambda', 'Invoked successfully');
          resolve(data);
        }
      });
    });
  }

  _timeEnough() {
    return (this.context.getRemainingTimeInMillis() > this.executionThreshold);
  }

  _buildRecipientMessage(recipient) {
    debug('= AttachSegmentMembersService._buildRecipientMessage', JSON.stringify(recipient));
    return Object.assign({}, this.attachRecipientsListMessage, { recipient });
  }
}

module.exports.AttachSegmentMembersService = AttachSegmentMembersService;
