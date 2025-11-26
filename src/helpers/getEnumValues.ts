/* 
1- <T extends Record<string, string>> - Generic type constraint for string key/value object
2- enumObject: T - Use this constraint for the input parameter
3- T[keyof T] - Returns union of object values, first position must be one of these
4- ...T[keyof T][] - Spreads additional values from the union, can be empty (0 or more)
*/

export const getEnumValues = <T extends Record<string, string>>(
  enumObject: T,
): [T[keyof T], ...T[keyof T][]] => {
  return Object.values(enumObject) as [T[keyof T], ...T[keyof T][]];
};
