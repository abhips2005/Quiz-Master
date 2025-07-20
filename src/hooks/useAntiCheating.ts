import { useEffect, useRef } from 'react';
import { recordSecurityViolation } from '../lib/supabase';

interface AntiCheatingOptions {
  sessionId?: string;
  participantId?: string;
  disableDevTools?: boolean;
  disableRightClick?: boolean;
  disableTextSelection?: boolean;
  disablePrintScreen?: boolean;
  onSuspiciousActivity?: (activity: string) => void;
}

export const useAntiCheating = (options: AntiCheatingOptions = {}) => {
  const suspiciousActivityCount = useRef(0);
  const {
    sessionId,
    participantId,
    disableDevTools = true,
    disableRightClick = true,
    disableTextSelection = true,
    disablePrintScreen = true,
    onSuspiciousActivity
  } = options;

  useEffect(() => {
    const reportSuspiciousActivity = async (activity: string, violationType: 'tab_switch' | 'right_click' | 'keyboard_shortcut' | 'dev_tools' | 'copy_paste' | 'focus_loss' = 'focus_loss') => {
      suspiciousActivityCount.current += 1;
      console.warn(`Suspicious activity detected: ${activity}`);
      
      // Store violation to database if session and participant are provided
      if (sessionId && participantId) {
        try {
          await recordSecurityViolation(sessionId, participantId, violationType);
        } catch (error) {
          console.error('Failed to store security violation:', error);
        }
      }
      
      if (onSuspiciousActivity) {
        onSuspiciousActivity(activity);
      }
    };

    // Disable right-click context menu
    const handleContextMenu = (e: Event) => {
      if (disableRightClick) {
        e.preventDefault();
        reportSuspiciousActivity('Right-click attempt', 'right_click');
      }
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      if (disableTextSelection) {
        e.preventDefault();
        reportSuspiciousActivity('Text selection attempt', 'copy_paste');
      }
    };

    // Disable common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12 (DevTools)
      if (e.key === 'F12' && disableDevTools) {
        e.preventDefault();
        reportSuspiciousActivity('F12 key pressed', 'dev_tools');
        return false;
      }

      // Disable Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') && disableDevTools) {
        e.preventDefault();
        reportSuspiciousActivity('DevTools shortcut attempt', 'dev_tools');
        return false;
      }

      // Disable Ctrl+Shift+J (Console)
      if ((e.ctrlKey && e.shiftKey && e.key === 'J') && disableDevTools) {
        e.preventDefault();
        reportSuspiciousActivity('Console shortcut attempt', 'dev_tools');
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        reportSuspiciousActivity('View source attempt', 'keyboard_shortcut');
        return false;
      }

      // Disable Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a' && disableTextSelection) {
        e.preventDefault();
        reportSuspiciousActivity('Select all attempt', 'copy_paste');
        return false;
      }

      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        reportSuspiciousActivity('Copy attempt', 'copy_paste');
        return false;
      }

      // Disable Ctrl+V (Paste) - might be used to paste from external sources
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        reportSuspiciousActivity('Paste attempt', 'copy_paste');
        return false;
      }

      // Disable Print Screen
      if (e.key === 'PrintScreen' && disablePrintScreen) {
        e.preventDefault();
        reportSuspiciousActivity('Print screen attempt', 'keyboard_shortcut');
        return false;
      }

      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        reportSuspiciousActivity('Print attempt', 'keyboard_shortcut');
        return false;
      }

      // Disable Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        reportSuspiciousActivity('Save attempt', 'keyboard_shortcut');
        return false;
      }
    };

    // Detect focus changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportSuspiciousActivity('Tab switched or window minimized', 'tab_switch');
      }
    };

    const handleBlur = () => {
      reportSuspiciousActivity('Window lost focus', 'tab_switch');
    };

    // Disable drag and drop
    const handleDragStart = (e: Event) => {
      e.preventDefault();
      reportSuspiciousActivity('Drag attempt', 'focus_loss');
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('blur', handleBlur);

    // DevTools detection (basic)
    if (disableDevTools) {
      const devToolsCheck = setInterval(() => {
        const threshold = 160;
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          reportSuspiciousActivity('Possible DevTools opening detected', 'dev_tools');
        }
      }, 1000);

      return () => {
        clearInterval(devToolsCheck);
      };
    }

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('blur', handleBlur);
    };
  }, [disableDevTools, disableRightClick, disableTextSelection, disablePrintScreen, onSuspiciousActivity]);

  return {
    suspiciousActivityCount: suspiciousActivityCount.current
  };
};
