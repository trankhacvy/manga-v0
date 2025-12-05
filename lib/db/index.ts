/**
 * Database Access Layer
 * 
 * Central export point for all database operations.
 */

// Page operations
export {
  getPage,
  getPagesForProject,
  getPageWithPanels,
  savePageWithLayout,
  updatePageLayout,
  updatePageMargins,
  updatePageDimensions,
  deletePage,
  createPageWithLayout,
  duplicatePage,
  getPageCount,
} from './pages';

// Panel operations
export {
  getPanelsForPage,
  getPanel,
  savePanelWithLayout,
  updatePanelPosition,
  updatePanelContent,
  updatePanelBubbles,
  deletePanel,
  createPanelsForPage,
  togglePanelLock,
  getPanelsForRegeneration,
} from './panels';
