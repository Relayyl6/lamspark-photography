import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAssetEligibility, checkTestimonialEligibility } from './index.ts';

test('Consent - Blocks social marketing if client only consented to private portfolio', () => {
  const consents = [
    {
      id: 'c-1',
      clientId: 'cli-1',
      consentType: 'image_portfolio',
      granted: true,
      wording: 'Consent to private website portfolio display',
      recordedAt: new Date().toISOString(),
    },
    {
      id: 'c-2',
      clientId: 'cli-1',
      consentType: 'image_marketing',
      granted: false,
      wording: 'Consent to Instagram and social ads',
      recordedAt: new Date().toISOString(),
    },
  ];

  const eligibility = checkAssetEligibility(consents);
  assert.equal(eligibility.canDisplayInPortfolio, true);
  assert.equal(eligibility.canUseInSocialMarketing, false);
});

test('Consent - Blocks everything if client granted no image consent', () => {
  const eligibility = checkAssetEligibility([]);
  assert.equal(eligibility.canDisplayInPortfolio, false);
  assert.equal(eligibility.canUseInSocialMarketing, false);
  assert.match(eligibility.reason, /Client has not granted image consent/);
});

test('Consent - Testimonial requires both client consent AND studio approval', () => {
  assert.equal(checkTestimonialEligibility(true, true), true);
  assert.equal(checkTestimonialEligibility(true, false), false);
  assert.equal(checkTestimonialEligibility(false, true), false);
  assert.equal(checkTestimonialEligibility(false, false), false);
});
