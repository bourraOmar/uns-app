import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, Keyboard } from 'react-native';

interface ScrollCollapseContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentRouteName: string;
  setCurrentRouteName: (route: string) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

  // Global Search State
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPlaceholder: string;
  setSearchPlaceholder: (placeholder: string) => void;
  openSearch: () => void;
  closeSearch: () => void;

  registerSearchHandler: (handler: () => void) => () => void;
  triggerSearch: () => void;
}

const ScrollCollapseContext = createContext<ScrollCollapseContextType | null>(null);

export function ScrollCollapseProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentRouteName, setCurrentRouteName] = useState('index');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPlaceholder, setSearchPlaceholder] = useState('ابحث...');

  const lastScrollY = useRef(0);
  const searchHandlerRef = useRef<(() => void) | null>(null);
  const currentRouteRef = useRef(currentRouteName);
  currentRouteRef.current = currentRouteName;

  const openSearch = useCallback(() => {
    setIsCollapsed(true);
    setIsSearchActive(true);
    if (searchHandlerRef.current) {
      searchHandlerRef.current();
    }
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentRouteRef.current === 'index') {
      // Home page: show menu bar JUST when it reaches the top of the page
      if (currentY <= 25) {
        setIsCollapsed(false);
      } else if (currentY > 35 && diff > 3) {
        setIsCollapsed(true);
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
    openSearch();
  }, [openSearch]);

  const updateCurrentRoute = useCallback((route: string) => {
    setCurrentRouteName(route);
    // When switching routes, close active search cleanly
    setIsSearchActive(false);
    setSearchQuery('');
  }, []);

  return (
    <ScrollCollapseContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        currentRouteName,
        setCurrentRouteName: updateCurrentRoute,
        onScroll,
        isSearchActive,
        setIsSearchActive,
        searchQuery,
        setSearchQuery,
        searchPlaceholder,
        setSearchPlaceholder,
        openSearch,
        closeSearch,
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
