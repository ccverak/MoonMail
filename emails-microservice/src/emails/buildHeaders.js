export default function buildHeaders(emailTemplate, metafields, { recipientId, listId, campaignId, userId, segmentId, unsubscribeUrl, attachments, apiHostname }) {
  return Promise.resolve([
    { key: 'List-Unsubscribe', value: `<${unsubscribeUrl}>` },
    { key: 'X-Moonmail-User-ID', value: userId },
    { key: 'X-Moonmail-Campaign-ID', value: campaignId },
    { key: 'X-Moonmail-List-ID', value: listId },
    { key: 'X-Moonmail-Recipient-ID', value: recipientId },
    { key: 'X-Moonmail-Segment-ID', value: segmentId }
  ]);
}
