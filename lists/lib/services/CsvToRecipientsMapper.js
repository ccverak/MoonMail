import Papa from 'papaparse';
import { Recipient } from 'moonmail-models';
import base64 from 'base64-url';
import moment from 'moment';
import _ from 'lodash';
import stripBom from 'strip-bom';

function mapCsvRecipients({csvString, userId, listId, metadataMapping}) {
  return new Promise((resolve, reject) => {
    const recipients = [];
    const safeCsvStrint = stripBom(csvString);
    return Papa.parse(safeCsvStrint, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      step: results => {
        try {
          if (results.errors.length > 0) return false;
          const row = results.data[0];
          const recipient = rowToRecipient(row, userId, listId, metadataMapping);
          isValidEmail(recipient.email) && recipients.push(recipient);
        } catch (err) {}
      },
      complete: () => {
        const uniqueRecipients = _.uniqBy(recipients, 'email')
        resolve(uniqueRecipients)
      }
    });
  });
}

function rowToRecipient(row, userId, listId, metadataMapping = {}) {
  const baseRecipient = buildBaseRecipient(row, userId, listId);
  return addMetadata(baseRecipient, row, metadataMapping);
}

function buildBaseRecipient(row, userId, listId) {
  const email = row.email.trim();
  const id = base64.encode(email);
  const baseRecipient = {
    email,
    id,
    userId,
    listId,
    status: Recipient.statuses.subscribed,
    isConfirmed: true,
    createdAt: moment().unix()
  };
  return baseRecipient;
}

function addMetadata(recipient, row, metadataMapping = {}) {
  const metadata = Object.entries(metadataMapping)
    .filter(el => el[1] && el[1] !== 'false')
    .reduce((metadata, columnMetadataMapping) => {
      const csvColumn = columnMetadataMapping[0];
      const metadataKey = columnMetadataMapping[1];
      return Object.assign({}, metadata, {[metadataKey]: row[csvColumn]});
    }, {});
  return Object.assign({}, recipient, {metadata});
}

function isValidEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

export default {
  execute: mapCsvRecipients
}