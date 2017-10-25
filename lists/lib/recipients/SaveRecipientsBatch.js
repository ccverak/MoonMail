import { Recipient } from 'moonmail-models';
import Promise from 'bluebird';

function splitInChunks(array, chunkSize) {
  return Array(Math.ceil(array.length / chunkSize))
    .fill()
    .map((_, i) => array.slice(i * chunkSize, i * chunkSize + chunkSize));
}

function saveRecipientsBatch(recipients) {
  const chunks = splitInChunks(recipients, 25);
  return Promise.map(chunks, chunk => Recipient.saveAll(chunk), { concurrency: 1 });
}

export default {
  execute: saveRecipientsBatch
};
