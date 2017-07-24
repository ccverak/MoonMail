import { debug } from './index';
import { Campaign } from 'moonmail-models';
import omitEmpty from 'omit-empty';

class SendCampaignService {

  constructor(snsClient, campaignId, userId) {
    this.snsClient = snsClient;
    this.campaignId = campaignId;
    this.userId = userId;
    this.attachRecipientsCountTopicArn = process.env.ATTACH_RECIPIENTS_COUNT_TOPIC_ARN;
  }

  sendCampaign() {
    debug('= SendCampaignService.sendCampaign', `Sending campaign with id ${this.campaignId}`);
    return this.getCampaign()
      .then(campaignRecord => this.buildCampaignMessage(campaignRecord))
      .then(canonicalMessage => this.publishToSns(canonicalMessage));
  }

  getCampaign() {
    debug('= SendCampaignService.getCampaign', this.campaignId);
    return Campaign.get(this.userId, this.campaignId);
  }

  buildCampaignMessage(campaign) {
    debug('= SendCampaignService.buildCampaignMessage', campaign);
    return new Promise((resolve) => {
      resolve(omitEmpty({
        userId: this.userId,
        campaign: {
          id: campaign.id,
          subject: campaign.subject,
          body: campaign.body,
          senderId: campaign.senderId,
          precompiled: false
        },
        listIds: campaign.listIds,
        segmentGId: campaign.segmentGId
      }));
    });
  }

  publishToSns(canonicalMessage) {
    return new Promise((resolve, reject) => {
      debug('= SendCampaignService.publishToSns', 'Sending canonical message', JSON.stringify(canonicalMessage));
      const params = {
        Message: JSON.stringify(canonicalMessage),
        TopicArn: this.attachRecipientsCountTopicArn
      };
      this.snsClient.publish(params, (err, data) => {
        if (err) {
          debug('= SendCampaignService.publishToSns', 'Error sending message', err);
          reject(err);
        } else {
          debug('= SendCampaignService.publishToSns', 'Message sent');
          resolve(data);
        }
      });
    });
  }
}

module.exports.SendCampaignService = SendCampaignService;
