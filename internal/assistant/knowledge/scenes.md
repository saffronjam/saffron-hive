# Scenes and effects

Scenes combine targets with one lighting design and explicit per-device behaviours. Targets can reference devices, groups, rooms or selectors. Explicit behaviours override lighting for their device and include it as a member. Manual lighting is capability-filtered. Vibe lighting is a canonical perceptual field with full_color or white_ambience domain, seed, brightness, movement and pace.

Discover scene input types, vibePresets, guidedVibeRound and previewVibe. Gallery, guided selections and normalized photos compile into the same Vibe representation through these APIs. Use attachment_photo for the existing 128×128 RGB photo sample (width, height, rgbBase64). Preview before saving a new Vibe. Preserve targets/behaviours not mentioned by the user.

Effects are timeline tracks or native device programs. Discover effect input types and nativeEffectOptions/nativeEffectSupport before authoring. See effect-config for typed clip kinds and configuration inputs. Clip time and transition bounds use milliseconds. Track clip order, loop and overall duration must validate. runEffect and runNativeEffect resolve a target; stopEffect stops its current run.

Scenes and effects share output ownership. Overlap can preempt another run. Moving Vibes sample at actual provider dispatch time. Stopping releases ownership without restoring prior device state. Starting an effect or applying a scene is a physical action, distinct from creating its definition.

## Authoring manual states

Resolve names to current IDs and inspect writable capabilities. Call `sceneAuthoring` with typed targets and source DEFAULTS or CURRENT. DEFAULTS constructs supported on/brightness/white or RGB values. CURRENT captures confirmed writable state; set fallbackToDefaults only when missing current state should use defaults. The query deduplicates overlapping targets, excludes disabled/removed/deleted devices, filters unsupported fields, and returns deviceId, lighting and state. It sends no commands. Optional desired values override the source per device; use Hive units (brightness 0–254, colour temperature mireds, transition seconds).

Build SceneDefinitionInput from these results: keep the requested targets, use lighting overrides of kind state for lighting devices, and supportingStates for other commandable devices. Sensor readings and device configuration settings are not scene state. Example: a dim warm hallway scene can use source DEFAULTS with desired `{on:true,brightness:13,colorTemp:500,transition:1}`. Inspect the returned states before saving; a switch-only device cannot dim. Query targets again if membership changes during the conversation.

Dynamic scenes use the existing typed Vibe source recipes and preview query. Discover those input types, select the intended full_color or white_ambience domain, and preserve explicit overrides and supporting states when editing. Effects use typed clip config variants (`setOnOff`, `setBrightness`, `setColor`, `nativeEffect`); supply exactly the one matching the clip kind. Colour clips choose RGB or temperature explicitly. Keep timings and tracks within the timeline's duration, preserve IDs, and inspect the saved result. See scene-config and effect-config for the public inputs.
