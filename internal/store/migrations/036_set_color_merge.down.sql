UPDATE effect_clips
SET kind = 'set_color_rgb',
    config = json(json_extract(config, '$.rgb'))
WHERE kind = 'set_color' AND json_extract(config, '$.mode') = 'rgb';

UPDATE effect_clips
SET kind = 'set_color_temp',
    config = json(json_extract(config, '$.temp'))
WHERE kind = 'set_color' AND json_extract(config, '$.mode') = 'temp';
