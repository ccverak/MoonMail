'use strict';

import * as chai from 'chai';
import { respond } from './action';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import * as sinonAsPromised from 'sinon-as-promised';
import { Open } from 'moonmail-models';
import { SaveKinesisStreamService } from '../../lib/save_kinesis_stream_service';
import * as event from './event.json';

chai.use(sinonChai);
const expect = chai.expect;

describe('saveOpens', () => {

  describe('#respond()', () => {
    const serviceStub = {save: () => true};

    beforeEach(() => {
      sinon.stub(serviceStub, 'save').resolves(true);
      sinon.stub(SaveKinesisStreamService, 'create').returns(serviceStub);
    });

    it('saves all the opens', (done) => {
      respond(event, (err, result) => {
        expect(SaveKinesisStreamService.create).to.have.been.calledWithExactly(event, Open);
        expect(serviceStub.save).to.have.been.calledOnce;
        done();
      });
    });

    afterEach(() => {
      SaveKinesisStreamService.create.restore();
      serviceStub.save.restore();
    });
  });
});
