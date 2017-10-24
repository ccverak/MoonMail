import fs from 'fs';
import { Recipient } from 'moonmail-models';
import base64 from 'base64-url';
import '../spec_helper';
import CsvToRecipientsMapper from './MapCsvToRecipients';

const validEmailsCsvContent = fs.readFileSync('./fixtures/250_valid_recipients.csv').toString();
const validEmailsCsvBomContent = fs.readFileSync('./fixtures/250_valid_recipients_with_bom.csv').toString();
const with3InvalidEmailsCsvContent = fs.readFileSync('./fixtures/247_valid_3_invalid_recipients.csv').toString();
const with8DuplicatedEmailsCsvContent = fs.readFileSync('./fixtures/242_valid_8_duplicated_recipients.csv').toString();
const userId = 'user-id';
const listId = 'list-id';
const metadataMapping = {
  Name: 'firstName',
  email: 'email',
  Country: 'country',
  'Last Name': 'surname',
  'Date of Birth': 'dob'
};
const expectValidRecipient = recipient => {
  expect(recipient).to.have.property('email').that.is.a('string');
  expect(recipient).to.have.property('createdAt').that.is.a('number');
  expect(recipient).to.have.property('userId', userId);
  expect(recipient).to.have.property('listId', listId);
  expect(recipient).to.have.property('status', Recipient.statuses.subscribed);
  expect(recipient).to.have.property('isConfirmed', true);
  const metadata = recipient.metadata;
  expect(metadata).to.have.property('firstName').that.is.a('string');
  expect(metadata).to.have.property('surname').that.is.a('string');
  expect(metadata).to.have.property('country').that.is.a('string');
  expect(metadata).to.have.property('dob').that.is.a('string');
  const id = base64.encode(recipient.email);
  expect(recipient).to.have.property('id', id);
};

describe('CsvToRecipientsMapper', () => {
  describe('.execute()', () => {
    it('map CSV contents to recipients objects', async () => {
      const params = {csvString: validEmailsCsvContent, userId, listId, metadataMapping};
      const result = await CsvToRecipientsMapper.execute(params);
      expect(result).to.have.lengthOf(250);
      result.forEach(recipient => expectValidRecipient(recipient));
    });
    it('skip non valid emails', async () => {
      const params = {csvString: with3InvalidEmailsCsvContent, userId, listId, metadataMapping};
      const result = await CsvToRecipientsMapper.execute(params);
      expect(result).to.have.lengthOf(247);
      result.forEach(recipient => expectValidRecipient(recipient));
    });
    it('deduplicate emails', async () => {
      const params = {csvString: with8DuplicatedEmailsCsvContent, userId, listId, metadataMapping};
      const result = await CsvToRecipientsMapper.execute(params);
      expect(result).to.have.lengthOf(242);
      result.forEach(recipient => expectValidRecipient(recipient));
    });
    it('should handle files with BOM', async () => {
      const params = {csvString: validEmailsCsvBomContent, userId, listId, metadataMapping};
      const result = await CsvToRecipientsMapper.execute(params);
      expect(result).to.have.lengthOf(250);
      result.forEach(recipient => expectValidRecipient(recipient));
    });
  });
});
