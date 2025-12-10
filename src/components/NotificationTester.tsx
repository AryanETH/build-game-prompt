import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { sendPushToAllUsers, sendPushToSelectedUsers, NotificationTemplates } from '@/lib/sendPushNotification';
import { showLocalNotification } from '@/lib/pushNotifications';
import { UserSelector } from './UserSelector';

export const NotificationTester = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendMode, setSendMode] = useState<'all' | 'selected'>('all');

  const handleSendCustom = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please enter both title and body');
      return;
    }

    if (sendMode === 'selected' && selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setLoading(true);
    try {
      // Show local notification for testing
      showLocalNotification(title, { 
        body,
        icon: '/Oplus only.png',
        image: imageUrl || undefined
      });

      // Send to selected users or all users
      const payload = NotificationTemplates.custom(title, body, { image: imageUrl });
      let result;

      if (sendMode === 'all') {
        result = await sendPushToAllUsers(payload);
        if (result.success) {
          toast.success(`Notification sent to ${result.sent}/${result.total} users!`);
        } else {
          toast.error('Failed to send notifications');
        }
      } else {
        result = await sendPushToSelectedUsers(selectedUsers, payload);
        if (result.success) {
          toast.success(`Notification sent to ${result.sent}/${result.total} subscribed users (${result.selectedCount} selected)!`);
        } else {
          toast.error(result.message || 'Failed to send notifications');
        }
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplate = (template: any) => {
    showLocalNotification(template.title, { 
      body: template.body,
      icon: template.icon,
      image: template.image,
      tag: template.tag 
    });
    toast.success('Template notification sent!');
  };

  return (
    <div className="space-y-4">
      {/* User Selector */}
      <UserSelector
        selectedUsers={selectedUsers}
        onSelectionChange={setSelectedUsers}
        sendMode={sendMode}
        onSendModeChange={setSendMode}
      />

      {/* Notification Tester */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🔔 Notification Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Custom Notification */}
        <div className="space-y-2">
          <h3 className="font-semibold">Custom Notification</h3>
          <Input
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Notification body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <Input
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Button 
            onClick={handleSendCustom}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Custom Notification'}
          </Button>
        </div>

        {/* Template Notifications */}
        <div className="space-y-2">
          <h3 className="font-semibold">Template Notifications</h3>
          <div className="grid gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.newLike('John', 'Space Adventure', '/placeholder.svg')
              )}
            >
              Test Like Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.newComment('Sarah', 'Racing Game', '/placeholder.svg')
              )}
            >
              Test Comment Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.newFollower('Mike', '/placeholder.svg')
              )}
            >
              Test Follow Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.gamePublished('My Awesome Game', '/placeholder.svg')
              )}
            >
              Test Publish Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.broadcast('Welcome to Oplus!', 'Start creating amazing games today', '/Oplus full logo.png')
              )}
            >
              Test Broadcast Notification
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};