import * as url from 'url';

export default function buildUnsubscribeUrl({ listId, recipientId, campaignId, apiHostname }) {
  const unsubscribePath = `lists/${listId}/recipients/${recipientId}/unsubscribe`;
  const unsubscribeUrl = {
    protocol: 'https',
    hostname: apiHostname,
    pathname: unsubscribePath,
    query: { cid: campaignId }
  };
  return url.format(unsubscribeUrl);
}
