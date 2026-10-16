import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface ScrollCollapseContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  registerSearchHandler: (handler: () => void) => () => void;
  triggerSearch: () => void;
}

const ScrollCollapseContext = createContext<ScrollCollapseContextType | null>(null);

export function ScrollCollapseProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const searchHandlerRef = useRef<(() => void) | null>(null);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    // When scrolling down past initial top space (> 40px)
    if (currentY > 40 && diff > 6) {
      setIsCollapsed(true);
    } else if (diff < -8 || currentY <= 20) {
      // When scrolling back up or near the top
      setIsCollapsed(false);
    }

    lastScrollY.current = currentY;
  }, []);

  const registerSearchHandler = useCallback((handler: () => void) => {
    searchHandlerRef.current = handler;
    return () => {
      searchHandlerRef.current = null;
    };
  }, []);

  const triggerSearch = useCallback(() => {
    if (searchHandlerRef.current) {
      searchHandlerRef.current();
    }
  }, []);

  return (
    <ScrollCollapseContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        onScroll,
        registerSearchHandler,
        triggerSearch,
      }}
    >
      {children}
    </ScrollCollapseContext.Provider>
  );
}

export function useScrollCollapse() {
  const context = useContext(ScrollCollapseContext);
  if (!context) {
    throw new Error('useScrollCollapse must be used within ScrollCollapseProvider');
  }
  return context;
}
