import chai from 'chai';
import sinon from 'sinon';
import buildUnsubscribeUrl from './buildUnsubscribeUrl';
import buildFromPart from './buildFromPart';
import buildHeaders from './buildHeaders';
import buildSubject from './buildSubject';
import buildBody from './buildBody';
import Emails from './index';

const { expect } = chai;

describe('Email', () => {
  const recipientId = 'recipient-id';
  const listId = 'list-id';
  const segmentId = 'segment-id';
  const campaignId = 'campaign-id';
  const userId = 'user-id';
  const unsubscribeUrl = 'http://something.com/unsunscribe-me';

  const from = 'email-from@example.com';
  const to = 'email-to@example.com';

  describe('.buildHeader', () => {
    it('builds the MM custom headers', async () => {
      const subject = 'Hello';
      const body = 'Hello world';
      const metafields = {
        name: 'Carlos'
      };
      const emailTemplate = { from, to, subject, body };
      const headers = await buildHeaders(emailTemplate, metafields, { recipientId, listId, segmentId, campaignId, userId, unsubscribeUrl, attachments: [], apiHostname: '' });
      const expected = [
        { key: 'List-Unsubscribe', value: '<http://something.com/unsunscribe-me>' },
        { key: 'X-Moonmail-User-ID', value: 'user-id' },
        { key: 'X-Moonmail-Campaign-ID', value: 'campaign-id' },
        { key: 'X-Moonmail-List-ID', value: 'list-id' },
        { key: 'X-Moonmail-Recipient-ID', value: 'recipient-id' },
        { key: 'X-Moonmail-Segment-ID', value: 'segment-id' }
      ];
      expect(headers).to.deep.equals(expected);
    });
  });

  describe('.buildSubject', () => {
    it('builds the subject by applying the liquid macros', async () => {
      const subject = 'Hello {{ name }}!';
      const body = 'Hello world';
      const metafields = {
        name: 'Carlos'
      };
      const emailTemplate = { from, to, subject, body };
      const newSubject = await buildSubject(emailTemplate, metafields, { recipientId, listId, segmentId, campaignId, userId, unsubscribeUrl, attachments: [], apiHostname: '' });
      const expected = 'Hello Carlos!';
      expect(newSubject).to.equals(expected);
    });
  });

  describe('.buildBody', () => {
    it('builds the body', async () => {
      const subject = 'Hello {{ name }}!';
      const body = 'Hello world {{ name }} {{ surname }}. {{ unsubscribe_url }}';
      const metafields = {
        name: 'Carlos',
        surname: 'Castellanos',
        address: 'My address'
      };
      const emailTemplate = { from, to, subject, body };
      const footerRequired = true;
      const builtBody = await buildBody(emailTemplate, metafields, { recipientId, listId, segmentId, campaignId, userId, footerRequired, unsubscribeUrl, attachments: [], apiHostname: 'api.moonmail.io' });

      const expectedTrackingCode = '<img src="https://api.moonmail.io/links/open/campaign-id?r=recipient-id&u=dXNlci1pZA&l=list-id&s=segment-id" width="1" height="1" />';

      expect(builtBody).to.contain(metafields.address);
      expect(builtBody).to.contain(unsubscribeUrl);
      expect(builtBody).to.contain(emailTemplate.to);
      expect(builtBody).to.contain(expectedTrackingCode);
      expect(builtBody).to.contain('Hello world Carlos Castellanos');


      const builtBodyWithoutFooter = await buildBody(emailTemplate, metafields, { recipientId, listId, segmentId, campaignId, userId, footerRequired: false, unsubscribeUrl, attachments: [], apiHostname: 'api.moonmail.io' });

      expect(builtBodyWithoutFooter).not.to.contain(metafields.address);
      expect(builtBodyWithoutFooter).not.to.contain('This email was sent to');
      expect(builtBodyWithoutFooter).to.contain(expectedTrackingCode);
      expect(builtBodyWithoutFooter).to.contain('Hello world Carlos Castellanos');
      expect(builtBody).to.contain(unsubscribeUrl);
    });
  });

  describe('.buildUnsubscribeUrl', () => {
    it('builds the unsusbcribe url for a given recipient', () => {
      const nUnsubscribeUrl = buildUnsubscribeUrl({ listId, recipientId, campaignId, apiHostname: 'api.moonmai.io' });
      const expected = 'https://api.moonmai.io/lists/list-id/recipients/recipient-id/unsubscribe?cid=campaign-id';
      expect(nUnsubscribeUrl).to.equals(expected);
    });
  });

  describe('.buildFromPart', () => {
    it('builds the from part of the email with the sender information', () => {
      const fromPart = buildFromPart({ fromName: 'Carlos Castellanos', emailAddress: 'example@email.com' });
      expect(fromPart).to.equals('"Carlos Castellanos" <example@email.com>');

      const fromPartWithoutName = buildFromPart({ emailAddress: 'example@email.com' });
      expect(fromPartWithoutName).to.equals('example@email.com');
    });
  });

  describe('.buildAttachments', () => {
    it('builds attachments', () => {
      // pending
    });
  });

  describe('.assemble', () => {
    it('prepares the email', async () => {
      const entity = {
        userId: 'user-id',
        campaignId: 'campaign-id',
        body: 'Hello world {{ name }} {{ surname }}!! {{ unsubscribe_url }}',
        subject: 'Hello {{ name }}',
        attachments: [{ name: 'file1', url: 'http://example.com/file1' }],
        footerRequired: true,
        apiHostname: 'api.moonmail.io'
      };
      const sender = {
        fromName: 'Carlos',
        emailAddress: 'email@example.com'
      };
      const recipient = {
        email: 'email@example.com',
        recipientId: 'recipient-id',
        listId: 'list-id',
        segmentId: 'segment-id',
        metadata: {
          name: 'Carlos',
          surname: 'Castellanos Vera',
          language: 'ES',
          address: 'my address'
        }
      };
      const assembledEmail = await Emails.assemble({ entity, sender, recipient });

      expect(assembledEmail).to.have.property('headers');
      expect(assembledEmail).to.have.property('attachments');
      expect(assembledEmail).to.have.property('body');
      expect(assembledEmail).to.have.property('subject');
      expect(assembledEmail).to.have.property('from');
      expect(assembledEmail).to.have.property('to');

      expect(assembledEmail.headers.length).to.equals(6);
      expect(assembledEmail.attachments).to.deep.equals([{ filename: 'file1', path: 'http://example.com/file1' }]);
      expect(assembledEmail.body).to.contain('https://api.moonmail.io/lists/list-id/recipients/recipient-id/unsubscribe?cid=campaign-id');
      expect(assembledEmail.body).to.contain('width="1" height="1" />');
      expect(assembledEmail.subject).to.equals('Hello Carlos');
      expect(assembledEmail.from).to.equals('"Carlos" <email@example.com>');
      expect(assembledEmail.to).to.equals('email@example.com');
    });
  });
});
