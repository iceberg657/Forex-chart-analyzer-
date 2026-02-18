
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTheme } from './useTheme';
import { useEdgeLighting, EdgeLightColor } from './useEdgeLighting';

// --- Custom Router Implementation ---

interface LocationState {
    pathname: string;
    state: any;
    search: string;
    hash: string;
    key: string;
}

interface RouterContextType {
  location: LocationState;
  navigate: (to: string | number, options?: { state?: any }) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export const MemoryRouter: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<LocationState[]>([{ pathname: '/', state: null, search: '', hash: '', key: 'default' }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const location = history[historyIndex];

  const navigate = (to: string | number, options?: { state?: any }) => {
    if (typeof to === 'number') {
      const newIndex = historyIndex + to;
      if (newIndex >= 0 && newIndex < history.length) {
        setHistoryIndex(newIndex);
      }
      return;
    }
    
    const [pathname, search] = to.split('?');
    const newLocation: LocationState = { 
        pathname, 
        state: options?.state || null, 
        search: search ? `?${search}` : '', 
        hash: '', 
        key: Math.random().toString() 
    };

    // Truncate "forward" history if we are creating a new navigation entry
    const newHistory = history.slice(0, historyIndex + 1);
    
    setHistory([...newHistory, newLocation]);
    setHistoryIndex(newHistory.length);
    window.scrollTo(0, 0);
  };

  return <RouterContext.Provider value={{ location, navigate }}>{children}</RouterContext.Provider>;
};

export const useNavigate = () => {
    const context = useContext(RouterContext);
    if (!context) throw new Error("useNavigate must be used within a Router");
    return context.navigate;
};

export const useLocation = () => {
    const context = useContext(RouterContext);
    if (!context) throw new Error("useLocation must be used within a Router");
    return context.location;
};

export const Link: React.FC<{ to: string, className?: string, children: ReactNode, onClick?: (e: React.MouseEvent) => void }> = ({ to, className, children, onClick }) => {
    const navigate = useNavigate();
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if(onClick) onClick(e);
        navigate(to);
    };
    return <a href={to} className={className} onClick={handleClick}>{children}</a>;
};

export const NavLink: React.FC<any> = ({ to, className, children, ...props }) => {
    const location = useLocation(); // Fixed: Do not destructure here, useLocation returns the object directly
    const navigate = useNavigate();
    const isActive = location.pathname === to;
    const finalClassName = typeof className === 'function' ? className({ isActive }) : className;
    
    return (
        <a 
            href={to} 
            className={finalClassName} 
            onClick={(e) => { e.preventDefault(); navigate(to); }}
            {...props}
        >
            {children}
        </a>
    );
};

export const Navigate: React.FC<{ to: string }> = ({ to }) => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to);
    }, [to]);
    return null;
};

const OutletContext = createContext<ReactNode>(null);

export const Outlet: React.FC = () => {
    const content = useContext(OutletContext);
    return <>{content}</>;
};

export const Route: React.FC<{ path?: string, element: ReactNode, children?: ReactNode }> = () => null;

export const Routes: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { pathname } = useLocation();
    
    const matchRoutes = (nodes: ReactNode): ReactNode => {
        const routes = React.Children.toArray(nodes) as React.ReactElement<{ path?: string; element: ReactNode; children?: ReactNode }>[];
        for (const route of routes) {
            const { path: routePath, element, children } = route.props;
            
            // Exact Match (or wildcard)
            if (routePath === pathname || (routePath === '*' && !children)) {
                return element;
            }
            
            // Wrapper/Layout Route
            if (!routePath && children) {
                const childMatch = matchRoutes(children);
                if (childMatch) {
                    return (
                        <OutletContext.Provider value={childMatch}>
                            {element}
                        </OutletContext.Provider>
                    );
                }
            }
        }
        return null;
    }

    return <>{matchRoutes(children)}</>;
};

// --- App Context ---

interface AppContextType {
  navigate: (page: string) => void;
  changeTheme: (theme: 'light' | 'dark') => void;
  setEdgeLight: (color: EdgeLightColor) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setEdgeLight } = useEdgeLighting();
  const reactRouterNavigate = useNavigate();

  const navigate = (page: string) => {
    const pageMap: { [key: string]: string } = {
        home: '/',
        landing: '/',
        dashboard: '/dashboard',
        charting: '/charting',
        charts: '/charting',
        analysis: '/analysis',
        'market-news': '/market-news',
        journal: '/journal',
        coders: '/coders',
        'bot-maker': '/coders#bot-maker', 
        'indicator-maker': '/coders#indicator-maker',
        pricing: '/pricing',
        predictor: '/predictor',
        'apex-ai': '/apex-ai',
        login: '/login', 
        signup: '/signup',
    };
    const path = pageMap[page.toLowerCase()] || '/';
    reactRouterNavigate(path);
  };

  const changeTheme = (newTheme: 'light' | 'dark') => {
    if (theme !== newTheme) {
      toggleTheme();
    }
  };

  const value = {
    navigate,
    changeTheme,
    setEdgeLight,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
