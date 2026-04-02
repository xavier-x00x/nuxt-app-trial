import AutoNumeric from "autonumeric";

export const useAutoNumeric = (
  el: HTMLInputElement | string | null,
  decimal = 2
) => {
  if (el) {
    return new AutoNumeric(el, {
      decimalCharacter: ".",
      decimalPlaces: decimal,
      emptyInputBehavior: "zero",
    });
  }
};
