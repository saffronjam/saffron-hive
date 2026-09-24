import { beforeEach, describe, expect, it } from "vitest";
import { setLanguage } from "$lib/i18n/locale.svelte";
import { historyFieldLabel, identifierLabel } from "$lib/i18n/vocabulary";

describe("localized identifier vocabulary", () => {
  beforeEach(() => setLanguage("en"));

  it("localizes known device capabilities without exposing wire identifiers", () => {
    setLanguage("ru");
    expect(historyFieldLabel("color")).toBe("Цвет");
    expect(historyFieldLabel("color_temp")).toBe("Цветовая температура");
    expect(historyFieldLabel("power_on_behavior")).toBe("Поведение при включении");
    expect(historyFieldLabel("effect")).toBe("Эффект");
    expect(identifierLabel("tilt")).toBe("Наклон");
  });

  it("humanizes unknown provider capabilities", () => {
    expect(historyFieldLabel("startup_current_level")).toBe("Startup current level");
    expect(identifierLabel("color_loop")).toBe("Color loop");
    expect(historyFieldLabel("startup_current_level", "Startup current")).toBe("Startup current");
  });

  it.each([
    ["sv", "Temperaturkalibrering", "Luftfuktighetskalibrering"],
    ["ru", "Калибровка температуры", "Калибровка влажности"],
  ] as const)(
    "localizes calibration fields in %s ahead of provider labels",
    (language, temperature, humidity) => {
      setLanguage(language);
      expect(historyFieldLabel("temperature_calibration", "Temperature calibration")).toBe(
        temperature,
      );
      expect(historyFieldLabel("temperatureCalibration")).toBe(temperature);
      expect(historyFieldLabel("humidity_calibration", "Humidity calibration")).toBe(humidity);
      expect(historyFieldLabel("humidityCalibration")).toBe(humidity);
    },
  );
});
