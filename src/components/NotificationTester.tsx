import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { sendPushToAllUsers, NotificationTemplates } from '@/lib/sendPushNotification';
import { showLocalNotification } from '@/lib/pushNotifications';

export const NotificationTester = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCustom = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please enter both title and body');
      return;
    }

    setLoading(true);
    try {
      // For now, just show local notification
      showLocalNotification(title, { body });
      toast.success('Test notification sent!');
      
      // In production, you would call:
      // await sendPushToAllUsers(NotificationTemplates.custom(title, body));
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
      tag: template.tag 
    });
    toast.success('Template notification sent!');
  };

  return (
    <Card className="w-full max-w-md">
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
                NotificationTemplates.newLike('John', 'Space Adventure')
              )}
            >
              Test Like Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.newComment('Sarah', 'Racing Game')
              )}
            >
              Test Comment Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.newFollower('Mike')
              )}
            >
              Test Follow Notification
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTemplate(
                NotificationTemplates.gamePublished('My Awesome Game')
              )}
            >
              Test Publish Notification
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};