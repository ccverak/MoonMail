import { expect } from 'chai';
import { Recipient } from 'moonmail-models';
import Events from './index';

describe('Events', () => {
  describe('.isValid()', () => {
    const validEvents = [
      {
        type: 'list.recipient.import',
        payload: {
          recipient: {
            id: 'recipient-id',
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            status: Recipient.statuses.subscribed,
            isConfirmed: true,
            metadata: {random: 'data'}
          }
        }
      }
    ];
    const invalidEvents = [
      {
        type: 'list.recipient.import',
        payload: {
          recipient: {
            id: 'recipient-id',
            email: 'recipient@email.com',
            listId: 'list-id',
            userId: 'user-id',
            status: 'non-existant',
            isConfirmed: true
          }
        }
      }
    ];

    it('should return true for valid events', () => {
      validEvents.forEach(event => expect(Events.isValid(event)).to.be.true);
    });

    it('should return false for invalid events', () => {
      invalidEvents.forEach(event => expect(Events.isValid(event)).to.be.false);
    });
  });
});
