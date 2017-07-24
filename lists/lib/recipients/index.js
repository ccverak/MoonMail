import { strip } from 'eskimo-stripper';
import moment from 'moment';
import ElasticSearch from '../elasticsearch/index';
import { List } from 'moonmail-models';
function validRecipient(recipient) {
  return !!recipient.listId && !!recipient.id && !!recipient.createdAt && !!recipient.email;
}

const Recipients = {
  indexName: process.env.ES_RECIPIENTS_INDEX_NAME,
  indexType: process.env.ES_RECIPIENTS_INDEX_TYPE,
  client: ElasticSearch.createClient({}),

  buildESId(recipient) {
    return `${recipient.listId}-${recipient.id}`;
  },

  createESRecipient(id, recipient) {
    if (!validRecipient(recipient)) return Promise.resolve();
    const recipientToIndex = Object.assign({}, recipient, { createdAt: moment.unix(recipient.createdAt).utc().format() });
    return ElasticSearch.createOrUpdateDocument(this.client, this.indexName, this.indexType, id, recipientToIndex);
  },

  updateESRecipient(id, newRecipient) {
    if (!validRecipient(newRecipient)) return Promise.resolve();
    const recipientToIndex = Object.assign({}, newRecipient, { createdAt: moment.unix(newRecipient.createdAt).utc().format() });
    return ElasticSearch.createOrUpdateDocument(this.client, this.indexName, this.indexType, id, recipientToIndex);
  },

  deleteESRecipient(id) {
    return ElasticSearch.deleteDocument(this.client, this.indexName, this.indexType, id).catch(Promise.resolve);
  },

  syncRecipientStreamWithES(records) {
    return Promise.map(records, record => this.syncRecipientRecordWithES(record), { concurrency: 10 });
  },

  // TODO: migrate to ES
  totalRecipients(userId) {
    return List.allBy('userId', userId)
      .then(lists => lists.items.filter(l => l.subscribedCount).reduce((accum, next) => (accum + next.subscribedCount), 0));
  },

  syncRecipientRecordWithES(record) {
    if (record.eventName === 'INSERT') {
      const item = strip(record.dynamodb.NewImage);
      return this.createESRecipient(this.buildESId(item), item);
    }
    if (record.eventName === 'MODIFY') {
      const item = strip(record.dynamodb.NewImage);
      return this.updateESRecipient(this.buildESId(item), item);
    }
    if (record.eventName === 'REMOVE') return this.deleteESRecipient(this.buildESId(strip(record.dynamodb.OldImage)));
  }
};

export default Recipients;
