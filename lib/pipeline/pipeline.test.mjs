import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionEnquiry } from './transition.ts';

const mockEnquiry = {
  id: 'enq-test-1',
  reference_code: 'LS-TEST',
  client_id: 'cli-test',
  session_type: 'toddler',
  package_id: 'toddler-luxury',
  stage: 'deposit_reported',
  waiting_on: 'us',
  stage_entered_at: new Date().toISOString(),
  source: 'WhatsApp',
  custom_quote: false,
  purpose_text: '1st Birthday Shoot',
  answers: { purpose: '1st Birthday' },
  created_at: new Date().toISOString(),
};

test('Pipeline - Hard Rule Guard: Deposit Paid cannot be confirmed without human verifier', () => {
  const result = transitionEnquiry(mockEnquiry, 'deposit_paid', 'system');
  assert.equal(result.success, false);
  assert.match(result.error, /Hard rule violation: A deposit can never be confirmed automatically/);
});

test('Pipeline - Transition to Deposit Paid with human verifier succeeds and updates audit', () => {
  const result = transitionEnquiry(mockEnquiry, 'deposit_paid', 'Osemene', {
    depositRecordedBy: 'Osemene',
    bankReference: 'GTB-TXN-123456',
  });

  assert.equal(result.success, true);
  assert.equal(result.enquiry.stage, 'deposit_paid');
  assert.equal(result.enquiry.deposit_recorded_by, 'Osemene');
  assert.equal(result.enquiry.bank_reference, 'GTB-TXN-123456');
  assert.equal(result.auditEvent.actor, 'Osemene');
});

test('Pipeline - Closing an enquiry requires a documented reason', () => {
  const result = transitionEnquiry(mockEnquiry, 'closed', 'Osemene');
  assert.equal(result.success, false);
  assert.match(result.error, /Closing an enquiry card requires a documented reason/);
});

test('Pipeline - Closing with reason succeeds', () => {
  const result = transitionEnquiry(mockEnquiry, 'closed', 'Osemene', {
    reason: 'Client chose alternative date',
  });

  assert.equal(result.success, true);
  assert.equal(result.enquiry.stage, 'closed');
  assert.equal(result.enquiry.closed_reason, 'Client chose alternative date');
});
