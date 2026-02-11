-- Add Stripe Integration
INSERT IGNORE INTO `integrations` (`id`, `name`, `slug`, `category`, `status`, `environment`, `is_default`, `fields`)
VALUES (
  UUID(), 'Stripe Payment', 'stripe', 'payment', 'active', 'production', 0,
  '[{"key": "apiKey", "label": "Secret Key (sk_...)", "type": "secret", "required": true, "value": ""}, {"key": "webhookSecret", "label": "Webhook Secret (whsec_...)", "type": "secret", "required": true, "value": ""}]'
);

-- Also insert for development environment just in case
INSERT IGNORE INTO `integrations` (`id`, `name`, `slug`, `category`, `status`, `environment`, `is_default`, `fields`)
VALUES (
  UUID(), 'Stripe Payment (Dev)', 'stripe', 'payment', 'active', 'development', 0,
  '[{"key": "apiKey", "label": "Secret Key (sk_test_...)", "type": "secret", "required": true, "value": ""}, {"key": "webhookSecret", "label": "Webhook Secret (whsec_...)", "type": "secret", "required": true, "value": ""}]'
);
