import cuid from 'cuid';
import { ListSegment } from 'moonmail-models';
import ElasticSearch from '../elasticsearch/index';

const Segments = {

  indexName: process.env.ES_RECIPIENTS_INDEX_NAME,
  indexType: process.env.ES_RECIPIENTS_INDEX_TYPE,
  client: ElasticSearch.createClient({}),
  listFilterCondition: listId => ({ condition: { queryType: 'match', fieldToQuery: 'listId', searchTerm: listId }, conditionType: 'filter' }),

  listSegmentMembersFromConditions(conditions, from, size) {
    return ListSegment.validateConditions(conditions)
      .then(conditions => ElasticSearch.buildQueryFilters(conditions).from(from).size(size))
      .then(query => ElasticSearch.search(this.client, this.indexName, this.indexType, query.build()))
      .then(esResult => ({ items: esResult.hits.hits.map(hit => hit._source), total: esResult.hits.total }));
  },

  getSegment(listId, id) {
    return ListSegment.get(listId, id)
      .then(segment => Object.assign({}, segment, { conditions: [...segment.conditions, this.listFilterCondition(listId)] }));
  },

  createSegment(segment) {
    const segmentToSave = Object.assign({}, { id: cuid() }, segment);
    return ListSegment.save(segmentToSave).then(() => segmentToSave);
  },

  updateSegment(newSegment, listId, id) {
    return ListSegment.update(newSegment, listId, id);
  },

  listSegments(listId, options = {}) {
    return ListSegment.allBy('listId', listId, Object.assign({}, { limit: 250 }, options));
  },

  archiveSegment(listId, id) {
    return this.updateSegment({ archived: true }, listId, id);
  },

  unArchiveSegment(listId, id) {
    return this.updateSegment({ archived: false }, listId, id);
  }
};

export default Segments;
