# Administration

Registered Hive users currently have administrative access. Existing authorization remains authoritative, including self-deletion and required password-change restrictions. Conversations and image attachments are private to their owner, including against other administrators. Chats receive an automatic name from the first question. A manual name overrides it; clearing that override restores the automatic name. Unnamed chats display a localized “New chat”.

Integrations are opt-in. Zigbee2MQTT removal preserves stable device rows and references. Tuya removal purges its devices. Claude removal stops assistant work and removes its token/configuration while preserving conversation history. Integration reconfiguration can interrupt device connectivity and requires confirmation when disruptive.

Passwords, integration tokens and newly issued webhook secrets are private. Omit secret values from action arguments; Hive renders its own private fields and binds values to that operation. Never paste secrets into ordinary chat. A masked secret sentinel means keep the stored value. Password resets, credential rotations, account deletion and forced logout require confirmation.

Read settings before editing and preserve unrelated keys. Settings under internal authentication namespaces are unavailable through the normal API. Use the schema to discover profile, localization, webhook, maintenance, alarms and diagnostic operations. Single-item cleanup is ordinarily direct; bulk removal or disable requires a fixed Hive confirmation card.
