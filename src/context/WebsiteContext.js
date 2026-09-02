import { createContext } from 'react';

/**
 * Isolated React Context definition for WebsiteData.
 * Kept in its own file so Fast Refresh (HMR) never re-creates the Context instance
 * when provider or hook implementations change.
 */
export const WebsiteDataContext = createContext(null);
