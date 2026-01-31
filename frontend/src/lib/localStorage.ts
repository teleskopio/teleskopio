export function getLocalBoolean(key: string, defaultValue = false): boolean {
  const value = localStorage.getItem(key);
  return value === null ? defaultValue : value === 'true';
}

export function setLocalBoolean(key: string, value: boolean) {
  localStorage.setItem(key, value.toString());
}

export function getLocalKeyObject(key: string) {
  const value = localStorage.getItem(key);
  return value === null ? JSON.parse('{}') : JSON.parse(value);
}

export function setLocalKeyObject(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function delLocalKey(key: string) {
  localStorage.removeItem(key);
}
