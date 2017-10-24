import { SimpleStatefulRecursiveService } from 'recursive-lambda';
import MapCsvToRecipients from './MapCsvToRecipients';
import PublishRecipientsBatch from './PublishRecipientBatch';

export default class ImportRecipientsCsv extends SimpleStatefulRecursiveService {

  static execute(params, lambdaClient, context) {
    return new ImportRecipientsCsv(params, lambdaClient, context).action();
  }

  constructor(params, lambdaClient, context) {
    super(params, lambdaClient, context);
    this.processingOffset = params.processingOffset;
    this.userId = params.userId;
    this.listId = params.listId;
    this.metadataMapping = params.metadataMapping;
    this.recipients = MapCsvToRecipients.execute({
      csvString: params.body,
      userId: this.userId,
      listId: this.listId,
      metadataMapping: this.metadataMapping
    });
    this.initState({
      recipients: this.recipients,
      processingOffset: this.processingOffset,
      processCompleted: false
    });
  }

  get batchSize() {
    return 100;
  }

  get executionInvariant() {
    return !this.state.isOperationAborted && !this.state.processCompleted;
  }

  action(state = {}) {
    if (state.processCompleted) return this.completeExecution();
    return this.importRecipients(state);
  }

  importRecipients(state) {
    const startIndex = this.state.processingOffset;
    const lastIndex = startIndex + this.batchSize;
    const recipientsBatch = state.recipients.slice(startIndex, lastIndex);
    return PublishRecipientsBatch.execute(recipientsBatch, startIndex, this.batchSize, state.recipients.length)
      .then(() => this.updateState({
        processingOffset: lastIndex,
        processCompleted: recipientsBatch.length <= state.processingOffset + this.batchSize
      }));
  }
}

