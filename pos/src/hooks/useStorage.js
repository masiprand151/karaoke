import { useState } from "react";

/**
 *
 * @param {string} keyName
 * @param {any} defaultValue
 * @returns
 */
export default function useStorage(keyName, defaultValue) {
  const [storage, setStorage] = useState(() => {
    try {
      const value = window.localStorage.getItem(keyName);
      if (value) {
        return JSON.parse(value);
      } else {
        window.localStorage.setItem(keyName, JSON.stringify(defaultValue));
        return defaultValue;
      }
    } catch (error) {
      return defaultValue;
    }
  });

  const setValue = (newValue) => {
    try {
      window.localStorage.setItem(
        keyName,
        typeof newValue === "string" ? newValue : JSON.stringify(newValue),
      );
    } catch (error) {
      console.log(error);
    }
    setStorage(newValue);
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(keyName);
    } catch (error) {
      console.log(error);
    }

    setStorage(null);
  };

  return [storage, setValue, removeValue];
}
