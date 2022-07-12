export const serializeObject = (object) => {
    return JSON.stringify(object);
}

export const deserializeObject = (string) => {
    return JSON.parse(string);
}