import { List } from 'moonmail-models';
import base64url from 'base64-url';
import FunctionsClient from './functions_client';


class AttachRecipientsCountService {

  static create(campaign, snsClient) {
    return new AttachRecipientsCountService(campaign, snsClient);
  }

  constructor(canonicalMessage, snsClient) {
    this.canonicalMessage = canonicalMessage;
    this.snsClient = snsClient;
  }

  attachCount() {
    return this.getRecipientsCount()
      .then(count => this._buildCanonicalMessage(count))
      .then(canonicalMessage => this._publishToSns(canonicalMessage));
  }

  getRecipientsCount() {
    if (this.canonicalMessage.campaign.segmentGId) return this._attachSegmentCount();
    return this._attachListCount();
  }

  _attachSegmentCount() {
    return this._countSegmentRecipients();
  }

  _attachListCount() {
    return this._getLists()
      .then(lists => this._countRecipients(lists));
  }

  _getLists() {
    const listIds = this.canonicalMessage.campaign.listIds;
    const getListPromises = listIds.map(listId => List.get(this.canonicalMessage.userId, listId));
    return Promise.all(getListPromises);
  }

  _countRecipients(lists) {
    const count = lists.reduce((accum, next) => (accum + next.subscribedCount), 0);
    return count;
  }

  _countSegmentRecipients() {
    const segmentGId = JSON.parse(base64url.decode(this.canonicalMessage.campaign.segmentGId));
    return FunctionsClient.execute(process.env.LIST_SEGMENT_MEMBERS_FUNCTION, {
      listId: segmentGId.listId,
      segmentId: segmentGId.segmentId,
      options: {
        conditions: [
          { condition: { queryType: 'match', fieldToQuery: 'status', searchTerm: 'subscribed' }, conditionType: 'filter' }
        ]
      }
    }).then(response => response.total);
  }

  _buildCanonicalMessage(recipientsCount) {
    return Object.assign({}, this.canonicalMessage, { recipientsCount });
  }

  _publishToSns(canonicalMessage) {
    const params = {
      Message: JSON.stringify(canonicalMessage),
      TopicArn: process.env.ATTACH_SENDER_TOPIC_ARN
    };
    return this.snsClient.publish(params).promise()
      .then(() => canonicalMessage);
  }
}

module.exports.AttachRecipientsCountService = AttachRecipientsCountService;
