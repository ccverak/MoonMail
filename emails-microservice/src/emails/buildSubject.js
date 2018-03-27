import * as Liquid from 'liquid-node';

const liquid = new Liquid.Engine();

export default function buildSubject(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, unsubscribeUrl, attachments, apiHostname }) {
  return liquid.parseAndRender(emailTemplate.subject, metafields);
}
