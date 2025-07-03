-- Create table to track WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  student_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  whatsapp_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own WhatsApp messages" 
ON public.whatsapp_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp messages" 
ON public.whatsapp_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_sent_at ON public.whatsapp_messages(sent_at);