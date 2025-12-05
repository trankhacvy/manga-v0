/**
 * Rendering Module
 * 
 * Exports all rendering utilities for manga/comic page composition.
 */

export { 
  PageRenderer,
  createPageRenderer,
  renderPage,
  relativeToAbsolute,
  absoluteToRelative,
} from './page-renderer';

export {
  BubbleRenderer,
  createBubbleRenderer,
  renderBubbles,
  bubbleAbsoluteToRelative,
  bubbleRelativeToAbsolute,
} from './bubble-renderer';

export type {
  RenderedPage,
  RenderedPanel,
  RenderedBubble,
  SafeArea,
  AbsolutePosition,
  RelativePosition,
} from '@/types/layouts';
