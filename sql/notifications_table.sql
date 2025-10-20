-- Create notifications table for the notification system
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'property_alert', 'inquiry_response', 'property_viewed', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_label TEXT,
    data JSONB, -- Additional data for the notification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Enable RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications for users" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title TEXT,
    p_message TEXT,
    p_action_url TEXT DEFAULT NULL,
    p_action_label TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        action_label,
        data
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_action_url,
        p_action_label,
        p_data
    ) RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_notification_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET read = TRUE, updated_at = NOW()
    WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid();

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Create function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM public.notifications
    WHERE user_id = p_user_id AND read = FALSE;

    RETURN unread_count;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
