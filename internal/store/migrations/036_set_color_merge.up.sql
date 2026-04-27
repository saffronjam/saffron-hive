UPDATE effect_clips
SET kind = 'set_color',
    config = json_object('mode', 'rgb', 'rgb', json(config))
WHERE kind = 'set_color_rgb';

UPDATE effect_clips
SET kind = 'set_color',
    config = json_object('mode', 'temp', 'temp', json(config))
WHERE kind = 'set_color_temp';
