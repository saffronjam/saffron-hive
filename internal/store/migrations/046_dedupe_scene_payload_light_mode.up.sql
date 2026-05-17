-- A scene's static payload addresses a light's white-point in exactly one
-- mode: either by mireds (`colorTemp`) or by RGB+xy (`color`). Rows that
-- carry both encode an ambiguous intent; on apply, zigbee2mqtt forwards
-- both to the bulb and Hue-family firmware honours `color_temp`, silently
-- overriding the colour the user picked. Drop the `colorTemp` value on
-- those rows so the explicit colour wins on apply.
UPDATE scene_device_payloads
SET payload = json_remove(payload, '$.colorTemp')
WHERE COALESCE(json_extract(payload, '$.kind'), 'static') = 'static'
  AND json_extract(payload, '$.color') IS NOT NULL
  AND json_extract(payload, '$.colorTemp') IS NOT NULL;
