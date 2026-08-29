DELETE FROM scene_device_behaviors
WHERE kind = 'state'
  AND on_state IS NULL
  AND brightness IS NULL
  AND color_temp IS NULL
  AND color_r IS NULL
  AND color_g IS NULL
  AND color_b IS NULL
  AND color_x IS NULL
  AND color_y IS NULL
  AND transition IS NULL
  AND target_temperature IS NULL
  AND hvac_mode IS NULL
  AND fan_mode IS NULL
  AND swing IS NULL;
