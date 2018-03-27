export default function buildAttachments(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, unsubscribeUrl, attachments, apiHostname }) {
  return Promise.resolve(attachments.map(att => ({ filename: att.name, path: att.url })));
}
