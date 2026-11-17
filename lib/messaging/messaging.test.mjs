import test from 'node:test';
import assert from 'node:assert/strict';
import { sendMessage } from './send.ts';

test('Messaging - Blocks message if client has requested STOP', () => {
  const result = sendMessage({
    clientId: 'cli-stop',
    recipientPhone: '+2348130847299',
    templateName: 'deposit_received',
    variables: { name: 'Amina', session_type: 'Toddler', ref_code: 'LS-9B2K' },
    category: 'utility',
    messagingConsentGranted: true,
    marketingConsentGranted: false,
    isStopListed: true,
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 'blocked');
  assert.match(result.reason, /STOP/);
});

test('Messaging - Fails closed if required variable is missing or blank', () => {
  const result = sendMessage({
    clientId: 'cli-blank',
    recipientPhone: '+2348130847299',
    templateName: 'deposit_received',
    variables: { name: '', session_type: 'Toddler', ref_code: 'LS-9B2K' },
    category: 'utility',
    messagingConsentGranted: true,
    marketingConsentGranted: false,
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 'blocked');
  assert.match(result.reason, /Blank or missing variable/);
});

test('Messaging - Queues message if sent outside Lagos sending hours (09:00 - 19:00)', () => {
  // Midnight Lagos time (23:00 UTC)
  const nightTime = new Date('2026-11-14T23:00:00Z').toISOString();

  const result = sendMessage({
    clientId: 'cli-night',
    recipientPhone: '+2348130847299',
    templateName: 'deposit_received',
    variables: { name: 'Hadiza', session_type: 'Maternity', ref_code: 'LS-4M7L' },
    category: 'utility',
    messagingConsentGranted: true,
    marketingConsentGranted: false,
    currentTimeIso: nightTime,
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'queued');
  assert.match(result.reason, /Outside allowed sending hours/);
});

test('Messaging - Dispatches immediately during valid Lagos working hours', () => {
  // 14:00 Lagos time (13:00 UTC)
  const dayTime = new Date('2026-11-14T13:00:00Z').toISOString();

  const result = sendMessage({
    clientId: 'cli-day',
    recipientPhone: '+2348130847299',
    templateName: 'deposit_received',
    variables: { name: 'Hadiza', session_type: 'Maternity', ref_code: 'LS-4M7L' },
    category: 'utility',
    messagingConsentGranted: true,
    marketingConsentGranted: false,
    currentTimeIso: dayTime,
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 'sent');
  assert.match(result.renderedBody, /Hadiza/);
  assert.match(result.renderedBody, /LS-4M7L/);
});
