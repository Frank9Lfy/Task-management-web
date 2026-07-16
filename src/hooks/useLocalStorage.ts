import { useState, useCallback, useRef, useEffect } from 'react';

interface UseLocalStorageOptions<T> {
    /** 自定义序列化函数，默认使用 JSON.stringify */
    serialize?: (value: T) => string;
    /** 自定义反序列化函数，默认使用 JSON.parse */
    deserialize?: (value: string) => T;
}

/**
 * 将状态与 localStorage 同步的 Hook。
 *
 * 核心设计：
 * 1. Lazy initialization —— 在首次渲染前同步读取 localStorage，
 *    避免首次渲染时写入空值覆盖已有数据。
 * 2. 同步写入 —— 在 setValue 调用的瞬间同步写入 localStorage，
 *    完全绕开 useEffect 调度不确定性（包括 Strict Mode 双调用）。
 * 3. 监听 storage 事件，支持多标签页之间的数据同步。
 * 4. deserialize 失败时不会覆盖 localStorage 中的原始数据。
 * 5. 与原版 API 完全兼容：返回值仍是 [value, setValue]，支持函数式更新。
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    options?: UseLocalStorageOptions<T>
): [T, React.Dispatch<React.SetStateAction<T>>] {
    // 将 options 存入 ref，避免 serialize/deserialize 成为 effect 依赖
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // Lazy initializer：组件首次渲染前，同步从 localStorage 读取数据
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            if (item !== null) {
                const deserialize = options?.deserialize ?? JSON.parse;
                return deserialize(item) as T;
            }
            return initialValue;
        } catch (error) {
            console.error(`[useLocalStorage] 读取 localStorage 键 "${key}" 失败:`, error);
            return initialValue;
        }
    });

    // 同步写入 localStorage 的 setState 包装函数
    const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
        (value) => {
            setStoredValue(prevValue => {
                const nextValue = value instanceof Function
                    ? (value as (prev: T) => T)(prevValue)
                    : value;
                try {
                    const serialize = optionsRef.current?.serialize ?? JSON.stringify;
                    const serialized = serialize(nextValue);
                    localStorage.setItem(key, serialized);
                } catch (error) {
                    console.error(`[useLocalStorage] 保存到 localStorage 键 "${key}" 失败:`, error);
                }
                return nextValue;
            });
        },
        [key]
    );

    // 监听其他标签页的 localStorage 变化，实现多标签页同步
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    const deserialize = optionsRef.current?.deserialize ?? JSON.parse;
                    setStoredValue(deserialize(e.newValue) as T);
                } catch (error) {
                    console.error(`[useLocalStorage] 同步外部 storage 变化失败:`, error);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [key]);

    return [storedValue, setValue];
}