import test from 'node:test';
import assert from 'node:assert/strict';

// Import our TypeScript source (or compiled mjs equivalent)
// For Node test runner without build step, let's test the logic directly:
import { calculateEstimate } from './engine.ts';

test('Estimate Engine - Base Toddler Package (Luxury)', () => {
  const result = calculateEstimate('toddler', {
    purpose: '1st Birthday Celebration',
    packageId: 'toddler-luxury',
  });

  assert.equal(result.total, 650000);
  assert.equal(result.depositPercent, 70);
  assert.equal(result.depositAmount, 455000); // 70% of 650,000
  assert.equal(result.balanceAmount, 195000);
  assert.equal(result.quoteRequired, false);
  assert.equal(result.lineItems.length, 1);
});

test('Estimate Engine - Toddler with Extra Child (50% multiple)', () => {
  const result = calculateEstimate('toddler', {
    purpose: 'Twin birthday',
    packageId: 'toddler-premium', // 350,000
    additionalChildCount: 1, // +50% of 350,000 = 175,000
  });

  assert.equal(result.total, 525000); // 350,000 + 175,000
  assert.equal(result.depositPercent, 70);
  assert.equal(result.depositAmount, 367500); // 70% of 525,000
  assert.equal(result.balanceAmount, 157500);
});

test('Estimate Engine - Maternity Deposit is 50%', () => {
  const result = calculateEstimate('maternity', {
    purpose: 'First pregnancy',
    packageId: 'maternity-signature-grace', // 255,000
    expressDelivery: true, // +30,000
  });

  assert.equal(result.total, 285000);
  assert.equal(result.depositPercent, 50); // Maternity is 50%
  assert.equal(result.depositAmount, 142500);
  assert.equal(result.balanceAmount, 142500);
});

test('Estimate Engine - Motherhood Bundle (Pre-discounted fixture)', () => {
  const result = calculateEstimate('motherhood-bundle', {
    purpose: 'Maternity + Newborn complete package',
    packageId: 'bundle-bloom',
  });

  assert.equal(result.total, 255000);
  assert.equal(result.depositPercent, 50);
  assert.equal(result.depositAmount, 127500);
});

test('Estimate Engine - Custom Quote when price is null', () => {
  const result = calculateEstimate('wedding', {
    purpose: '2-day wedding celebration in Abuja',
  });

  assert.equal(result.quoteRequired, true);
  assert.equal(result.total, 0);
  assert.equal(result.depositAmount, 0);
});
