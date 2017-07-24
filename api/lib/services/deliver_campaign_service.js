import Promise from 'bluebird';
import omitEmpty from 'omit-empty';
import base64url from 'base64-url';
import { debug } from '../logger';
import { Campaign, List } from 'moonmail-models';
import inlineCss from 'inline-css';
import juice from 'juice';
import { compressString } from '../utils';
import FunctionsClient from '../functions_client';


class DeliverCampaignService {

  constructor(snsClient, { campaign, campaignId, userId, userPlan } = {}) {
    this.snsClient = snsClient;
    this.campaign = campaign;
    this.campaignId = campaignId;
    this.userId = userId;
    this.userPlan = userPlan || 'free';
    this.attachRecipientsCountTopicArn = process.env.ATTACH_RECIPIENTS_COUNT_TOPIC_ARN;
    this.updateCampaignStatusTopicArn = process.env.UPDATE_CAMPAIGN_TOPIC_ARN;
  }

  sendCampaign() {
    debug('= DeliverCampaignService.sendCampaign', `Sending campaign with id ${this.campaignId}`);
    return this.checkUserQuota()
      .then(() => this._getCampaign())
      .then(campaign => this._checkCampaign(campaign))
      .then(campaign => this._compressCampaignBody(campaign))
      .then(campaign => this._buildCampaignMessage(campaign))
      .then(canonicalMessage => this._publishToSns(canonicalMessage))
      .then(() => this._updateCampaignStatus());
  }

  checkUserQuota() {
    debug('= DeliverCampaignService._checkUserQuota', this.userId);
    return Promise.props({
      sentCampaignsInLastDay: Campaign.sentLastNDays(this.userId, 1),
      recipientsCount: this._getRecipientsCount(),
      totalRecipients: this._getTotalRecipients()
    }).then((currentState) => {
      this.currentState = currentState;
      return this._checkSubscriptionLimits(currentState);
    });
  }

  _getRecipientsCount() {
    // Probably this should relay in a micro-service instead of calling Lists directly
    return this._getLists()
      .then(lists => this._countRecipients(lists));
  }

  _getLists() {
    return this._getCampaign()
      .then((campaign) => {
        const listIds = campaign.listIds;
        if (listIds) {
          const getListPromises = listIds.map(listId => List.get(this.userId, listId));
          return Promise.all(getListPromises);
        }
        return Promise.resolve();
      });
  }

  _countRecipients(lists) {
    if (lists) {
      const count = lists.reduce((accum, next) => (accum + next.subscribedCount), 0);
      return Promise.resolve(count);
    }
    return Promise.resolve(0);
  }

  _getCampaign() {
    return new Promise((resolve, reject) => {
      if (this.campaign) {
        debug('= DeliverCampaignService._getCampaign', 'Updating campaign', this.campaign);
        resolve(Campaign.update(this.campaign, this.userId, this.campaignId));
      } else if (this.campaignId && this.userId) {
        debug('= DeliverCampaignService._getCampaign', `ID ${this.campaignId} and user ID ${this.userId} was provided`);
        resolve(Campaign.get(this.userId, this.campaignId));
      } else {
        debug('= DeliverCampaignService._getCampaign', 'No info provided');
        reject('No campaign info provided');
      }
    });
  }

  _compressCampaignBody(campaign) {
    return new Promise((resolve, reject) => {
      const compressedBody = compressString(campaign.body);
      const compressedCampaign = Object.assign({}, campaign, { body: compressedBody });
      resolve(compressedCampaign);
    });
  }

  _checkCampaign(campaign) {
    debug('= DeliverCampaignService._checkCampaign', JSON.stringify(campaign));
    return new Promise((resolve, reject) => {
      if (Campaign.isValidToBeSent(campaign)) {
        resolve(campaign);
      } else {
        reject('Campaign not ready to be sent');
      }
    });
  }

  _buildCampaignMessage(campaign) {
    debug('= DeliverCampaignService._buildCampaignMessage', campaign);
    return new Promise((resolve) => {
      const inlinedBody = juice(campaign.body);
      resolve(omitEmpty({
        userId: campaign.userId,
        userPlan: this.userPlan,
        currentUserState: this.currentState,
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
          body: inlinedBody,
          senderId: campaign.senderId,
          precompiled: false,
          listIds: campaign.listIds,
          segmentGId: campaign.segmentGId
        }
      }));
    });
  }
  _publishToSns(canonicalMessage) {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService._publishToSns', 'Sending canonical message', JSON.stringify(canonicalMessage));
      const params = {
        Message: JSON.stringify(canonicalMessage),
        TopicArn: this.attachRecipientsCountTopicArn
      };
      this.snsClient.publish(params, (err, data) => {
        if (err) {
          debug('= DeliverCampaignService._publishToSns', 'Error sending message', err);
          reject(err);
        } else {
          debug('= DeliverCampaignService._publishToSns', 'Message sent');
          resolve(data);
        }
      });
    });
  }

  _updateCampaignStatus() {
    return new Promise((resolve, reject) => {
      debug('= DeliverCampaignService._updateCampaignStatus');
      const campaignStatus = { campaignId: this.campaignId, userId: this.userId, status: 'pending' };
      const params = {
        Message: JSON.stringify(campaignStatus),
        TopicArn: this.updateCampaignStatusTopicArn
      };
      this.snsClient.publish(params, (err, data) => {
        if (err) {
          debug('= DeliverCampaignService._updateCampaignStatus', 'Error sending message', err);
          reject(err);
        } else {
          debug('= DeliverCampaignService._updateCampaignStatus', 'Message sent');
          resolve({ id: this.campaignId, status: 'pending' });
        }
      });
    });
  }

  _checkSubscriptionLimits({ sentCampaignsInLastDay, recipientsCount }) {
    const lambdaName = process.env.CHECK_SUBSCRIPTION_LIMITS_FUNCTION;
    debug('= DeliverCampaignService.invokeLambda', lambdaName);
    const payload = { userId: this.userId, currentState: { sentCampaignsInLastDay, recipientsCount } };
    return FunctionsClient.execute(lambdaName, payload)
      .then(response => response.quotaExceeded ? Promise.reject(new Error('User can\'t send more campaigns')) : Promise.resolve({}));
  }

  _getTotalRecipients() {
    return FunctionsClient.execute(process.env.GET_TOTAL_RECIPIENTS_FUNCTION, { userId: this.userId })
      .then(response => response.totalRecipients);
  }
}

module.exports.DeliverCampaignService = DeliverCampaignService;
