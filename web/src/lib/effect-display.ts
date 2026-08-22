export function effectCapabilityLabel(capability: string): string {
  switch (capability) {
    case "on_off":
      return "On/Off";
    case "color_temp":
      return "Color temp";
    case "brightness":
      return "Brightness";
    case "color":
      return "Color";
    default:
      return capability;
  }
}
