import Promise from 'bluebird';
import mailcomposer from 'mailcomposer';
import { scheduleJob } from 'job-scheduler';
import buildUnsubscribeUrl from './buildUnsubscribeUrl';
import buildFromPart from './buildFromPart';
import buildHeaders from './buildHeaders';
import buildAttachments from './buildAttachments';
import buildSubject from './buildSubject';
import buildBody from './buildBody';


const assemble = async function assemble({ entity: { userId, campaignId, body, subject, attachments, apiHostname, footerRequired }, sender: { fromName, emailAddress }, recipient: { recipientId, listId, segmentId, email, metadata } }) {
  const metafields = metadata || {};
  const fromPart = buildFromPart({ fromName: fromName || '', emailAddress });
  const unsubscribeUrl = buildUnsubscribeUrl({ listId, recipientId, campaignId, apiHostname });

  const emailTemplate = {
    from: fromPart,
    to: email,
    subject,
    body
  };

  const context = {
    recipientId,
    listId,
    campaignId,
    userId,
    segmentId: segmentId || '',
    footerRequired,
    unsubscribeUrl,
    attachments: attachments || [],
    apiHostname
  };

  scheduleJob(topic , { my: 'payload' }, { event, context });

  return Promise.props({
    headers: buildHeaders(emailTemplate, metafields, context),
    attachments: buildAttachments(emailTemplate, metafields, context),
    subject: buildSubject(emailTemplate, metafields, context),
    body: buildBody(emailTemplate, metafields, context),
    from: fromPart,
    to: email
  });
};

const compose = function compose(assembledEmail) {
  const composer = mailcomposer(assembledEmail);
  composer.build((err, message) => {
    if (err) return Promise.reject(err);
    return Promise.resolve({ RawMessage: { Data: message } });
  });
};

export default {
  assemble,
  compose
};
