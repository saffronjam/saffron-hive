import { describe, expect, it } from "vitest";
import { m } from "$lib/i18n/messages";

describe("translated catalog plurals", () => {
  it("selects English and Swedish singular and plural forms", () => {
    expect(m.shared_device_count({ count: 1 }, { locale: "en" })).toBe("1 device");
    expect(m.shared_device_count({ count: 2 }, { locale: "en" })).toBe("2 devices");
    expect(m.shared_device_count({ count: 1 }, { locale: "sv" })).toBe("1 enhet");
    expect(m.shared_device_count({ count: 2 }, { locale: "sv" })).toBe("2 enheter");
  });

  it("selects Russian one, few, many, and other forms", () => {
    expect(m.shared_device_count({ count: 1 }, { locale: "ru" })).toBe("1 устройство");
    expect(m.shared_device_count({ count: 2 }, { locale: "ru" })).toBe("2 устройства");
    expect(m.shared_device_count({ count: 5 }, { locale: "ru" })).toBe("5 устройств");
    expect(m.shared_device_count({ count: 11 }, { locale: "ru" })).toBe("11 устройств");
    expect(m.shared_device_count({ count: 21 }, { locale: "ru" })).toBe("21 устройство");
    expect(m.shared_device_count({ count: 22 }, { locale: "ru" })).toBe("22 устройства");
    expect(m.shared_device_count({ count: 25 }, { locale: "ru" })).toBe("25 устройств");
  });

  it("uses Russian home-automation vocabulary instead of literal English homonyms", () => {
    expect(m.shared_view_cards({}, { locale: "ru" })).toBe("Галерея");
    expect(m.shared_view_table({}, { locale: "ru" })).toBe("Таблица");
    expect(m.state_on({}, { locale: "ru" })).toBe("Включено");
    expect(m.state_off({}, { locale: "ru" })).toBe("Выключено");
    expect(m.state_light_on_brightness({ percent: "41%" }, { locale: "ru" })).toBe(
      "Включено · 41%",
    );
    expect(m.device_power({}, { locale: "ru" })).toBe("Питание");
    expect(m.device_color({}, { locale: "ru" })).toBe("Цвет");
    expect(m.device_white({}, { locale: "ru" })).toBe("Белый свет");
    expect(m.scene_create_turn_on({ name: "Flower 1" }, { locale: "ru" })).toBe(
      "Включить Flower 1",
    );
  });

  it("uses grammatical Russian contact states and light counts", () => {
    expect(m.contact_summary_single({ role: "door", state: "open" }, { locale: "ru" })).toBe(
      "Дверь открыта",
    );
    expect(m.contact_summary_single({ role: "door", state: "closed" }, { locale: "ru" })).toBe(
      "Дверь закрыта",
    );
    expect(m.lights_on_count({ on: 0, total: 1 }, { locale: "ru" })).toBe("0 из 1 лампы");
    expect(m.lights_on_count({ on: 2, total: 5 }, { locale: "ru" })).toBe("2 из 5 ламп");
  });

  it("keeps reviewed Russian interface terminology", () => {
    expect(m.nav_logs({}, { locale: "ru" })).toBe("Журнал");
    expect(m.nav_alarms({}, { locale: "ru" })).toBe("Оповещения");
    expect(m.nav_data_viewer({}, { locale: "ru" })).toBe("Анализ данных");
    expect(m.profile_account({}, { locale: "ru" })).toBe("Учётная запись");
    expect(m.auth_sign_in_title({}, { locale: "ru" })).toBe("Вход");
    expect(m.auth_sign_in({}, { locale: "ru" })).toBe("Войти");
    expect(m.shared_actions({}, { locale: "ru" })).toBe("Действия");
    expect(m.zigbee_vendor({}, { locale: "ru" })).toBe("Изготовитель");
    expect(m.group_create_more({}, { locale: "ru" })).toBe("Создать ещё");
    expect(m.history_view_more({}, { locale: "ru" })).toBe("Дополнительная информация");
    expect(m.button_last_seen({ time: "12:58" }, { locale: "ru" })).toBe(
      "Последняя активность: 12:58",
    );
    expect(m.field_last_seen({}, { locale: "ru" })).toBe("Последняя активность");
    expect(m.scenes_column_targets({}, { locale: "ru" })).toBe("Объекты");
    expect(m.scenes_target_count({ count: 1 }, { locale: "ru" })).toBe("1 объект");
    expect(m.scene_editor_selector({}, { locale: "ru" })).toBe("Фильтр");
    expect(m.shared_selector_count({ count: 1 }, { locale: "ru" })).toBe("1 фильтр");
    expect(m.vibe_source_gallery_detail({}, { locale: "ru" })).toBe(
      "Начните с выбора настроения освещения.",
    );
    expect(m.vibe_source_photo_detail({}, { locale: "ru" })).toBe(
      "Превратите фото в цветовую сцену.",
    );
    expect(m.vibe_source_individual_detail({}, { locale: "ru" })).toBe(
      "Выбирайте конкретные состояния ламп и устройств.",
    );
    expect(m.vibe_source_guided_detail({}, { locale: "ru" })).toBe(
      "Создайте атмосферу, выбрав от трёх до пяти вариантов.",
    );
    expect(m.vibe_choose_photo({}, { locale: "ru" })).toBe("Выбрать фотографию");
    expect(m.vibe_guided({}, { locale: "ru" })).toBe("Коллекция");
    expect(m.vibe_choices_round({ round: 2 }, { locale: "ru" })).toBe("Коллекция, этап 2");
    expect(m.scene_create_vibe_preview_empty({}, { locale: "ru" })).toBe(
      "Здесь появится результат.",
    );
    expect(m.vibe_load_failed({}, { locale: "ru" })).toBe(
      "Не удалось загрузить галерею освещения.",
    );
    expect(m.vibe_preview_aria_empty({}, { locale: "ru" })).toBe("Предпросмотр освещения");
    expect(m.vibe_preview_aria_swatches({ count: 2 }, { locale: "ru" })).toBe(
      "Предпросмотр освещения с 2 основными цветами",
    );
    expect(m.scene_create_error_choose_vibe({}, { locale: "ru" })).toBe(
      "Перед продолжением нужно выбрать вариант освещения.",
    );
    expect(m.vibe_domain_full_color({}, { locale: "ru" })).toBe("Цветной");
    expect(m.vibe_domain_white_ambience({}, { locale: "ru" })).toBe("Дневная атмосфера");
    expect(m.vibe_category_whites({}, { locale: "ru" })).toBe("Бесцветные");
    expect(m.scene_editor_pace({}, { locale: "ru" })).toBe("Цикл");
    expect(m.scene_editor_shuffle({}, { locale: "ru" })).toBe("Рандомизировать");
    expect(m.scene_create_adjust_lighting({}, { locale: "ru" })).toBe("Выбор освещения");
    expect(m.scene_create_choose_location({}, { locale: "ru" })).toBe("Локация");
    expect(m.scene_create_name_title({}, { locale: "ru" })).toBe("Название сцены");
    expect(m.scene_create_choose_look({}, { locale: "ru" })).toBe("Выбор внешнего вида");
    expect(m.scene_create_title({}, { locale: "ru" })).toBe("Создание сцены");
    expect(m.scene_create_breadcrumb({}, { locale: "ru" })).toBe("Создание");
    expect(m.shared_unsaved_leave({}, { locale: "ru" })).toBe("Выйти без сохранения");
    expect(m.webhooks_url_once({}, { locale: "ru" })).toBe(
      "Этот URL показан один раз. Сохраните его перед закрытием.",
    );
    expect(m.effects_column_required({}, { locale: "ru" })).toBe("Использует");
    expect(m.effects_no_required_capabilities({}, { locale: "ru" })).toBe(
      "Возможности не используются",
    );
    expect(m.icon_search_prompt({}, { locale: "ru" })).toBe("Иконки");
  });

  it("uses Swedish history terminology", () => {
    expect(m.device_history({}, { locale: "sv" })).toBe("Historik");
    expect(m.settings_history({}, { locale: "sv" })).toBe("Historik");
    expect(m.nav_automations({}, { locale: "sv" })).toBe("Automatiseringar");
    expect(m.automations_title({}, { locale: "sv" })).toBe("Automatiseringar");
    expect(m.auth_sign_in_title({}, { locale: "sv" })).toBe("Logga in");
    expect(m.scenes_column_breakdown({}, { locale: "sv" })).toBe("Väljare");
    expect(m.field_breakdown({}, { locale: "sv" })).toBe("Sammansättning");
    expect(m.shared_actions({}, { locale: "sv" })).toBe("Funktioner");
    expect(m.scene_action_apply({}, { locale: "sv" })).toBe("Starta");
    expect(m.scene_apply_named({ name: "Kväll" }, { locale: "sv" })).toBe("Starta Kväll");
    expect(m.device_apply({}, { locale: "sv" })).toBe("Tillämpa");
    expect(m.data_viewer_add({}, { locale: "sv" })).toBe("Lägg till");
    expect(m.scene_editor_add({}, { locale: "sv" })).toBe("Lägg till");
    expect(m.integrations_add_short({}, { locale: "sv" })).toBe("Lägg till");
    expect(m.scene_editor_live({}, { locale: "sv" })).toBe("Live");
    expect(m.logs_live({}, { locale: "sv" })).toBe("Live");
    expect(m.vibe_use({}, { locale: "sv" })).toBe("Använd atmosfär");
    expect(m.devices_search({}, { locale: "sv" })).toBe("Sök bland enheter...");
    expect(m.automations_search({}, { locale: "sv" })).toBe(
      "Sök bland automatiseringar...",
    );
    expect(m.automations_create_description({}, { locale: "sv" })).toBe(
      "Du kan sedan ange när den ska köras och vad den ska göra i grafredigeraren.",
    );
    expect(m.logs_search({}, { locale: "sv" })).toBe("Sök bland loggposter...");
    expect(m.icon_search({}, { locale: "sv" })).toBe("Sök bland ikoner...");
  });

  it("uses Russian infinitives for actions rather than English-style imperatives", () => {
    expect(m.dashboard_setup_integration({}, { locale: "ru" })).toBe(
      "Настроить первую интеграцию",
    );
    expect(m.room_create_first({}, { locale: "ru" })).toBe("Создать первую комнату");
    expect(m.group_create_first({}, { locale: "ru" })).toBe("Создать первую группу");
    expect(m.scenes_create_first({}, { locale: "ru" })).toBe("Создать первую сцену");
    expect(m.effects_create_first({}, { locale: "ru" })).toBe("Создать первый эффект");
    expect(m.automations_create_first({}, { locale: "ru" })).toBe(
      "Создать первую автоматизацию",
    );
    expect(m.webhooks_create_first({}, { locale: "ru" })).toBe("Создать первый вебхук");
    expect(m.device_select_mode({}, { locale: "ru" })).toBe("Выбрать режим");
    expect(m.scene_choose_icon({}, { locale: "ru" })).toBe("Выбрать значок сцены");
    expect(m.automation_node_select_trigger({}, { locale: "ru" })).toBe("Выбрать триггер");
    expect(m.tuya_select_region({}, { locale: "ru" })).toBe("Выбрать регион");
    expect(m.webhooks_outcome_rate_limited({}, { locale: "ru" })).toBe("Превышен лимит");
    expect(m.effect_timeline_end_gap({ end: "5 с", gap: "1 с" }, { locale: "ru" })).toBe(
      "Конец: 5 с (интервал 1 с)",
    );
  });
});
