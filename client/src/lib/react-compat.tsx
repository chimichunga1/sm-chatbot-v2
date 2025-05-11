/**
 * React Compatibility Layer 
 * 
 * This file provides forward compatibility with React 19 features
 * while still using React 18.3. As components are migrated to use this
 * layer, they'll be easier to upgrade to React 19 in the future.
 */
import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  createContext,
  useContext,
  type ReactNode,
  type FC
} from 'react';

// Re-export all standard hooks and types for consistent imports
export {
  useState,
  useEffect,
  useRef, 
  useCallback,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
  type FC
};

// Simulate the useFormStatus hook from React 19
interface FormStatus {
  pending: boolean;
  data: FormData | null;
  method: string | null;
  action: string | null;
}

export function useFormStatus(): FormStatus {
  // This is a simulated implementation that will be replaced by the real hook in React 19
  const [status, setStatus] = useState<FormStatus>({
    pending: false,
    data: null,
    method: null,
    action: null
  });

  return status;
}

// Simulate the useOptimistic hook from React 19
export function useOptimistic<State, Action>(
  state: State,
  updateFn: (currentState: State, action: Action) => State
): [State, (action: Action) => void] {
  const [optimisticState, setOptimisticState] = useState<State>(state);
  
  const dispatchOptimistic = useCallback((action: Action) => {
    setOptimisticState(currentState => updateFn(currentState, action));
  }, [updateFn]);

  // When the actual state changes, update our optimistic state too
  useEffect(() => {
    setOptimisticState(state);
  }, [state]);

  return [optimisticState, dispatchOptimistic];
}

// Create a helper for React 19's use() functionality
// This is a simplified version that works with promises
export function use<T>(promise: Promise<T>): T {
  // In React 18, we can't actually implement this properly,
  // so we'll throw an error if someone tries to use it
  throw new Error(
    "The use() hook is only available in React 19. " +
    "Use React.Suspense with a resource loader instead."
  );
}

// Add simple forward-compatibility for the new React.cache function
export function cache<Args extends any[], Result>(fn: (...args: Args) => Result): (...args: Args) => Result {
  const cachedResults = new Map<string, Result>();
  
  return (...args: Args): Result => {
    const key = JSON.stringify(args);
    if (cachedResults.has(key)) {
      return cachedResults.get(key)!;
    }
    const result = fn(...args);
    cachedResults.set(key, result);
    return result;
  };
}

// Simulate the useActionState hook
export function useActionState<State>(
  action: (...args: any[]) => Promise<State>,
  initialState: State
): [State, (...args: any[]) => Promise<State>, boolean] {
  const [state, setState] = useState<State>(initialState);
  const [isPending, setIsPending] = useState(false);

  const wrappedAction = async (...args: any[]): Promise<State> => {
    setIsPending(true);
    try {
      const result = await action(...args);
      setState(result);
      return result;
    } finally {
      setIsPending(false);
    }
  };

  return [state, wrappedAction, isPending];
}

// Export a version flag to check if we're using the real React 19 or the compatibility layer
export const isReact19 = false;