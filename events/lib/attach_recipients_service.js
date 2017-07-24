import Promise from 'bluebird';
import { debug } from './index';
import { Recipient } from 'moonmail-models';
import * as async from 'async';

class AttachRecipientsService {
  constructor(snsClient, campaignMessage) {
    this.snsClient = snsClient;
    this.campaignMessage = campaignMessage;
  }

  execute() {
    if (this.campaignMessage.campaign.segmentGId) return this.notifyAttachSegmentMembers();
    return this.notifyAttachListRecipients();
  }

  notifyAttachSegmentMembers() {
    debug('= AttachRecipientsService.attachSegmentmembers', this.campaignMessage.campaign.segmentGId);
    return this._notifyAttachSegmentMembers(this._buildAttachSegmentMembersMessage(this.campaignMessage.campaign.segmentGId)
      .then(() => this._wait(5000))
      .then(() => this._notifyToUpdateCampaignStatus())
      .then(() => this._notifyToSendEmails());
  }

  notifyAttachListRecipients() {
    debug('= AttachRecipientsService.attachListRecipients', this.campaignMessage.listIds);
    return Promise.map(this.listIds, listId => this._notifyAttachListRecipients(this._buildAttachListRecipientsMessage(listId)), { concurrency: 5 })
      .then(() => this._wait(5000))
      .then(() => this._notifyToUpdateCampaignStatus())
      .then(() => this._notifyToSendEmails());
  }

  _buildAttachListRecipientsMessage(listId) {
    return {
      sender: this.campaignMessage.sender,
      campaign: this.campaignMessage.campaign,
      userId: this.campaignMessage.userId,
      userPlan: this.campaignMessage.userPlan || 'free',
      listId
    };
  }

  // Fanout
  _notifyAttachListRecipients(attachListRecipientsMessage) {
    debug('= AttachRecipientsService._notifyAttachListRecipients', JSON.stringify(attachListRecipientsMessage));
    const params = {
      TopicArn: process.env.ATTACH_LIST_RECIPIENTS_TOPIC_ARN,
      Message: JSON.stringify(attachListRecipientsMessage)
    };
    return this.snsClient.publish(params).promise();
  }

  _buildAttachSegmentMembersMessage(segmentGId) {
    return {
      sender: this.campaignMessage.sender,
      campaign: this.campaignMessage.campaign,
      userId: this.campaignMessage.userId,
      userPlan: this.campaignMessage.userPlan || 'free',
      segmentGId
    };
  }

  // Fanout
  _notifyAttachSegmentMembers(attachSegmentMembersMessage) {
    debug('= AttachRecipientsService._notifyAttachSegmentMembers', JSON.stringify(attachSegmentMembersMessage));
    const params = {
      TopicArn: process.env.ATTACH_SEGMENTS_RECIPIENTS_TOPIC_ARN,
      Message: JSON.stringify(attachSegmentMembersMessage)
    };
    return this.snsClient.publish(params).promise();
  }

  _notifyToUpdateCampaignStatus() {
    debug('= AttachRecipientsService._notifyToUpdateCampaignStatus', JSON.stringify(this.campaignMessage));
    const campaignStatus = {
      status: 'sent',
      campaignId: this.campaignMessage.campaign.id,
      userId: this.campaignMessage.userId
    };
    const params = {
      TopicArn: process.env.UPDATE_CAMPAIGN_TOPIC_ARN,
      Message: JSON.stringify(campaignStatus)
    };
    return this.snsClient.publish(params).promise();
  }

  _notifyToSendEmails() {
    debug('= AttachRecipientsService._notifyToSendEmails', JSON.stringify(this.campaignMessage));
    const snsParams = {
      TopicArn: process.env.SEND_EMAILS_TOPIC_ARN,
      Message: JSON.stringify({ QueueName: this.campaignMessage.userId.replace('|', '_') })
    };
    this.snsClient.publish(snsParams).promise();
  }

  _wait(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
}

module.exports.AttachRecipientsService = AttachRecipientsService;
