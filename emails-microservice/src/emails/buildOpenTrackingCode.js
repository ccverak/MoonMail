import omitEmpty from 'omit-empty';
import base64url from 'base64-url';
import * as url from 'url';

const buildOpenTrackingUrl = function buildOpenTrackingUrl({ listId, recipientId, segmentId, userId, campaignId, apiHostname }) {
  const path = `links/open/${campaignId}`;
  const opensUrlObj = {
    protocol: 'https',
    hostname: apiHostname,
    pathname: path
  };
  const encodedUserId = base64url.encode(userId);
  opensUrlObj.query = omitEmpty({ r: recipientId, u: encodedUserId, l: listId, s: segmentId });
  return url.format(opensUrlObj);
};

export default function buildOpenTrackingCode({ listId, recipientId, segmentId = '', userId, campaignId, apiHostname }) {
  const openTrackingUrl = buildOpenTrackingUrl({ listId, recipientId, segmentId, userId, campaignId, apiHostname });
  const imageTag = `<img src="${openTrackingUrl}" width="1" height="1" />`;
  return imageTag;
}
