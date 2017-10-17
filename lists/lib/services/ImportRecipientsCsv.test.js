import '../spec_helper';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import ImportRecipientsCsv from './ImportRecipientsCsv';

describe('.execute()', () => {
  it('should pass the CSV file contents to the mapper service');
  it('should call the trigger save recipients service with correct parameters');

  context('when there is no offset', () => {
    it('should create import status');
  });
  context('when there is offset', () => {
    it('should be provided to trigger save recipients service');
  });
  context('when the task finished successfully', () => {
    it('should update import status with success');
  });
  context('when the task fails', () => {
    it('should update import status with failed');
  });
  context('when the task has timed out', () => {
    it('should not update import status');
    it('should invoke the function again providing current status');
  });
});