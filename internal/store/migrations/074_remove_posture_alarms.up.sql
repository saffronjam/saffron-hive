DELETE FROM alarms
WHERE source = 'system.monitor'
  AND alarm_id LIKE 'system.device_posture_abnormal.%';
