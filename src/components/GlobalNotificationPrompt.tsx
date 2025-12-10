import { useState, useEffect } from 'react';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';

export const GlobalNotificationPrompt = () => {
  const [promptConfig, setPromptConfig] = useState<{
    visible: boolean;
    variant: 'banner' | 'modal' | 'inline';
    trigger: 'immediate' | 'after_action' | 'after_time';
  }>({
    visible: false,
    variant: 'banner',
    trigger: 'immediate'
  });

  useEffect(() => {
    // Listen for custom events to show notification prompt
    const handleShowPrompt = (event: CustomEvent) => {
      setPromptConfig({
        visible: true,
        variant: event.detail?.variant || 'modal',
        trigger: event.detail?.trigger || 'after_action'
      });
    };

    window.addEventListener('show-notification-prompt', handleShowPrompt as EventListener);

    return () => {
      window.removeEventListener('show-notification-prompt', handleShowPrompt as EventListener);
    };
  }, []);

  const handleClose = () => {
    setPromptConfig(prev => ({ ...prev, visible: false }));
  };

  if (!promptConfig.visible) {
    return null;
  }

  return (
    <NotificationPermissionPrompt
      variant={promptConfig.variant}
      trigger={promptConfig.trigger}
      onClose={handleClose}
    />
  );
};