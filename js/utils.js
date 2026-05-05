/*
Macht Kopie von Level
Original in levels.js bleibt immer gleich
*/

export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
