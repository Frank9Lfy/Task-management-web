import { useState, useEffect, useRef } from 'react';

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
 * 2. 使用 ref 标记首次渲染，确保只有在 state 被用户明确更新后才写入 localStorage。
 * 3. 监听 storage 事件，支持多标签页之间的数据同步。
 * 4. deserialize 失败时不会覆盖 localStorage 中的原始数据。
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    options?: UseLocalStorageOptions<T>
): [T, React.Dispatch<React.SetStateAction<T>>] {
    // 将 options 存入 ref，避免 serialize/deserialize 成为 effect 依赖
    const optionsRef = useRef(options);
    optionsRef.current = options;

    // 标记是否是首次渲染，防止首次渲染时覆盖 localStorage 已有数据
    const isFirstRender = useRef(true);

    // Lazy initializer：组件首次渲染前，同步从 localStorage 读取数据
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            if (item !== null) {
                const deserialize = options?.deserialize ?? JSON.parse;
                return deserialize(item);
            }
            return initialValue;
        } catch (error) {
            console.error(`[useLocalStorage] 读取 localStorage 键 "${key}" 失败:`, error);
            return initialValue;
        }
    });

    // 只在 state 明确被用户更新后（非首次渲染）才写入 localStorage
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        try {
            const serialize = optionsRef.current?.serialize ?? JSON.stringify;
            const serialized = serialize(storedValue);
            localStorage.setItem(key, serialized);
        } catch (error) {
            console.error(`[useLocalStorage] 保存到 localStorage 键 "${key}" 失败:`, error);
        }
    }, [key, storedValue]);

    // 监听其他标签页的 localStorage 变化，实现多标签页同步
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    const deserialize = optionsRef.current?.deserialize ?? JSON.parse;
                    setStoredValue(deserialize(e.newValue));
                } catch (error) {
                    console.error(`[useLocalStorage] 同步外部 storage 变化失败:`, error);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [key]);

    return [storedValue, setStoredValue];
}
