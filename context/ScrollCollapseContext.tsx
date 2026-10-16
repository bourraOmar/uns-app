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
  currentRouteName: string;
  setCurrentRouteName: (route: string) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  registerSearchHandler: (handler: () => void) => () => void;
  triggerSearch: () => void;
}

const ScrollCollapseContext = createContext<ScrollCollapseContextType | null>(null);

export function ScrollCollapseProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState('index');
  const lastScrollY = useRef(0);
  const searchHandlerRef = useRef<(() => void) | null>(null);
  const currentRouteRef = useRef(currentRouteName);
  currentRouteRef.current = currentRouteName;

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentRouteRef.current === 'index') {
      // Home page: collapse on scroll down, expand on scroll up / top
      if (currentY > 40 && diff > 6) {
        setIsCollapsed(true);
      } else if (diff < -8 || currentY <= 20) {
        setIsCollapsed(false);
      }
    } else {
      // Non-home pages: stay collapsed. If user manually expanded menu, scrolling down closes it.
      if (diff > 6 || currentY > 40) {
        setIsCollapsed(true);
      }
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
        currentRouteName,
        setCurrentRouteName,
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
