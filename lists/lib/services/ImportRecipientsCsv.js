// import AWS from 'aws-sdk';
// import Promise from 'bluebird';
import { SimpleStatefulRecursiveService } from 'recursive-lambda';
import CsvToRecipientsMapper from './CsvToRecipientsMapper';
// import { logger } from '../../lib/index';

class ImportRecipientsCsv extends SimpleStatefulRecursiveService {

  static create(params, lambdaClient, context) {
    // params = {fileName, metadataMapping, csvString, offset = 0}
    return new ImportRecipientsCsv(params, lambdaClient, context);
  }

  constructor(params, lambdaClient, context) {
    super(params, lambdaClient, context);
    const fileTokens = this.state.fileName.split('.');
    const userId = fileTokens[0];
    const listId = fileTokens[1];
    this.initState({userId, listId});
  }

  // beforeInvokeLambda() {
  //   this.updateState({
  //     Records: [{ Sns: { Message: JSON.stringify(this.eventMessage) } }],
  //     processingOffset: this.state.processingOffset
  //   }, true);
  // }

  get batchSize() {
    return 100;
  }

  get executionInvariant() {
    return this.state.offset < this.state.recipients.length;
  }

  action() {
    return this._fetchRecipients()
      .then(recipients => this.importRecipientsBatch(recipients));
  }

  importRecipientsBatch(recipients = []) {
    const firstRecipientIndex = this.state.offset || 0;
    const lastRecipientIndex = firstRecipientIndex + this.batchSize;
    const recipientsBatch = recipients.slice(firstRecipientIndex, lastRecipientIndex);
    return this._sendImportBatchEvent(recipientsBatch)
      .then(() => this.updateState({offset: lastRecipientIndex}));
  }

  _sendImportBatchEvent(recipientsBatch) {
    console.log(recipientsBatch.length);
    return Promise.resolve(true);
  }

  _fetchRecipients() {
    return this.state.recipients
      ? Promise.resolve(this.state.recipients)
      : this._recipientsFromCsv();
  }

  _recipientsFromCsv() {
    return CsvToRecipientsMapper.execute(this.state)
      .then(recipients => {
        const totalRecipients = recipients.length;
        this.updateState({recipients, totalRecipients});
        return recipients;
      });
  }
}

export default ImportRecipientsCsv;
