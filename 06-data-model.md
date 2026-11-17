# 06 Data Model

Relational (Postgres). All tables have `id (uuid)`, `created_at`, `updated_at`. Money in integer **kobo** or whole naira (pick one, document it, use whole naira for display). All timestamps UTC, shown in Africa/Lagos.

## Core
**client**: name, whatsapp_e164 (unique), email, instagram_handle, source_first, notes, owner_id, marketing_consent (bool, timestamp, wording), messaging_consent (bool, timestamp, wording), no_celebratory (bool), restricted_comfort_note (restricted field).

**client_person**: client_id, kind (child | partner | family_member), name, age, birthdate? Used for child/partner details. Parent-given and parent-consented.

**enquiry** (the pipeline card): client_id, session_type, package_id?, stage, owner_id, waiting_on (client | us), stage_entered_at, source, source_detail (UTM), reference_code (unique, short), custom_quote (bool), purpose_text, feeling_text, answers (jsonb), closed_reason?, closed_at?, referred_by_client_id?.

**estimate_snapshot**: enquiry_id, line_items (jsonb), total, deposit_percent, deposit_amount, balance_amount, rules_version, valid_until, price_agreed_at?, created_by_session.

**payment**: enquiry_id, kind (deposit | balance), amount_expected, amount_recorded?, status (reported | recorded | rejected), screenshot_asset_id, ai_check (jsonb: amount, date, reference, match flag), recorded_by?, recorded_at?, bank_reference?.

**booking**: enquiry_id, shoot_start, shoot_end, location_type (studio | outside | both), location_detail, status (confirmed | rescheduled | cancelled | completed), reschedule_count.

**preparation**: enquiry_id, token, status (incomplete | partial | complete), answers (jsonb), terms_accepted_at, comfort_note (restricted), health_details (restricted, only where session needs, e.g. maternity).

**editing_job**: booking_id, status (queued | culling | editing | review | done), due_date, priority (bool), assigned_to?, gallery_url?, delivered_at?, gallery_expires_at?.

## Catalog
**package**, **add_on**, **pricing_rule**, **policy** (terms text per session type). See file 05.

## Content and media
**asset**: storage_key, kind (image | video), session_booking_id?, session_type, colour_graded (bool), consent_status (none | portfolio | marketing | both), mood_tags[], setting_tags[], alt_text, alt_text_approved (bool).

**gallery** / **gallery_item**: portfolio galleries per category with ordering.
**story**, **testimonial** (first_name, session_type, quote, consent_at, approved_by), **journal_post**, **faq**, **page_block** (editable text blocks per page).

**content_item**: platforms[], format, purpose, pillar, session_type?, asset_ids[], caption_by_platform (jsonb), publish_at_by_platform (jsonb), status (idea | drafting | approved | scheduled | posted | reviewed), live_url_by_platform, journal_post_id?, source_tag.
**caption_bank**: text with placeholders `{session_type} {location} {season}`, pillar, usage_count.
**weekly_target**: platform, per_week.

## Messaging
**conversation**: client_id, channel (whatsapp | instagram | facebook | web), state (bot | human | closed), taken_over_by?, last_inbound_at, window_expires_at (24h service window).
**message**: conversation_id, direction, body, template_name?, status (queued | sent | delivered | read | failed), setting (automatic | reviewed | personal), ai_label?, ai_draft?, sent_by?.
**template**: name, category (utility | marketing), body, variables, meta_status (draft | submitted | approved | rejected), approved_by_owner (bool).
**consent_log** (append-only): client_id, type (messaging | marketing_messages | image_use | testimonial), granted (bool), wording, ip?, at.

## Ops
**user**: email, name, role (owner | full | limited), active.
**audit_event**: actor, entity, entity_id, action, diff, at. Required for stage changes, payments, consent, price edits.
**settings**: working_hours, sending_hours (default 09:00 to 19:00), stalled_after_hours, weekly_capacity, business_number, deposit defaults, close reasons list.

## Constraints and rules
- `enquiry.stage` transitions validated in one service (file 07). No direct writes elsewhere.
- Restricted fields readable only by owner/full roles and excluded from exports, logs and messages by default.
- Soft delete clients on erasure request, hard delete after retention rules, anonymise payment records only as tax rules allow.
- Index: `client.whatsapp_e164`, `enquiry.reference_code`, `enquiry(stage, waiting_on, stage_entered_at)`, `conversation(window_expires_at)`.
