import { useEffect, useCallback } from 'react';

export interface KeyboardHandlers {
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onSpace?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onTab?: () => void;
  [key: string]: (() => void) | undefined;
}

export interface KeyboardNavigationOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: HTMLElement | null;
}

export const useKeyboardNavigation = (
  handlers: KeyboardHandlers,
  options: KeyboardNavigationOptions = {}
) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = null
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const { key, code } = event;
    
    // Map key codes to handler names
    const keyMap: Record<string, keyof KeyboardHandlers> = {
      'ArrowLeft': 'onArrowLeft',
      'ArrowRight': 'onArrowRight',
      'ArrowUp': 'onArrowUp',
      'ArrowDown': 'onArrowDown',
      ' ': 'onSpace',
      'Space': 'onSpace',
      'Enter': 'onEnter',
      'Escape': 'onEscape',
      'Home': 'onHome',
      'End': 'onEnd',
      'Tab': 'onTab'
    };

    const handlerKey = keyMap[key] || keyMap[code];
    const handler = handlerKey ? handlers[handlerKey] : handlers[key];

    if (handler) {
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }
      handler();
    }
  }, [handlers, enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    const targetElement = target || window;
    
    if (enabled) {
      targetElement.addEventListener('keydown', handleKeyDown as EventListener);
    }

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, enabled, target]);

  return {
    isEnabled: enabled
  };
};

// Utility hook for focus management
export const useFocusManagement = () => {
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((previouslyFocusedElement: HTMLElement | null) => {
    if (previouslyFocusedElement && document.contains(previouslyFocusedElement)) {
      previouslyFocusedElement.focus();
    }
  }, []);

  return {
    trapFocus,
    restoreFocus
  };
};
