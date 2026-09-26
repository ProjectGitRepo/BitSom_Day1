// Palette per the dataviz skill's validated default (references/palette.md).
// Status colors are fixed and never themed; used for ready/reskillable/hire-gap semantics.
export const status = {
  good: "#0ca30c", // Ready now (has the skill)
  warning: "#fab219", // Reskillable
  critical: "#d03b3b" // Hire externally / gap
};

// Fixed-order categorical slots (never cycled/reassigned per filter).
export const categorical = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948" // red
];

export const sequentialBlue = "#2a78d6";

export const ink = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  baseline: "#c3c2b7"
};
