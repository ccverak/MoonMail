import chai from 'chai';
import sinon from 'sinon';
import 'sinon-as-promised';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import Recipients from './index';
import ElasticSearch from '../elasticsearch/index';

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Recipients', () => {

  describe('#createESRecipient', () => {
    const validRecipient = { listId: 'list-id', id: 'id', createdAt: '1496763455', email: 'a@example.com' };
    const invalidRecipient = { id: 'id', createdAt: '2313123123', email: 'a@example.com' };

    before(() => {
      sinon.stub(ElasticSearch, 'createOrUpdateDocument').resolves(true);
    });
    after(() => {
      ElasticSearch.createOrUpdateDocument.restore();
    });

    it('ignores invalid recipients', (done) => {
      Recipients.createESRecipient('id', invalidRecipient).then(() => {
        expect(ElasticSearch.createOrUpdateDocument).not.to.have.been.called;
        done();
      }).catch(err => done(err));
    });

    it('processes and indexes valid recipients', (done) => {
      Recipients.createESRecipient('id', validRecipient).then(() => {
        expect(ElasticSearch.createOrUpdateDocument).to.have.been.called;
        done();
      }).catch(err => done(err));
    });
  });

  describe('#syncRecipientRecordWithES', () => {
    before(() => {
      sinon.stub(Recipients, 'createESRecipient').resolves(true);
      sinon.stub(Recipients, 'updateESRecipient').resolves(true);
      sinon.stub(Recipients, 'deleteESRecipient').resolves(true);
    });
    after(() => {
      Recipients.createESRecipient.restore();
      Recipients.updateESRecipient.restore();
      Recipients.deleteESRecipient.restore();
    });
    const insertEvent = {
      eventName: 'INSERT', dynamodb: { NewImage: { name: { S: 'some-name' } } }
    };
    const updateEvent = {
      eventName: 'MODIFY', dynamodb: { NewImage: { name: { S: 'some-name-2' } } }
    };
    const removeEvent = {
      eventName: 'REMOVE', dynamodb: { OldImage: { name: { S: 'some-name' } } }
    };

    context('when event is an insert', () => {
      it('it performs an update in ES', (done) => {
        Recipients.syncRecipientRecordWithES(insertEvent).then((result) => {
          expect(result).to.exist;
          expect(Recipients.createESRecipient).to.have.been.called;
          done();
        }).catch(error => done(error));
      });
    });

    context('when event is an update', () => {
      it('it performs an update in ES', (done) => {
        Recipients.syncRecipientRecordWithES(updateEvent).then((result) => {
          expect(result).to.exist;
          expect(Recipients.updateESRecipient).to.have.been.called;
          done();
        }).catch(error => done(error));
      });
    });

    context('when event is a deletion', () => {
      it('it performs a deletion in ES', (done) => {
        Recipients.syncRecipientRecordWithES(removeEvent).then((result) => {
          expect(result).to.exist;
          expect(Recipients.deleteESRecipient).to.have.been.called;
          done();
        }).catch(error => done(error));
      });
    });
  });
});