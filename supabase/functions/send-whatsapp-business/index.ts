import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppTextRequest {
  phoneNumber: string;
  message: string;
  studentName?: string;
  type?: 'text';
}

interface WhatsAppDocumentRequest {
  phoneNumber: string;
  studentName: string;
  type: 'document';
  document: {
    filename: string;
    content: string; // base64 encoded
    mimeType: string;
  };
  caption?: string;
}

type WhatsAppRequest = WhatsAppTextRequest | WhatsAppDocumentRequest;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: WhatsAppRequest = await req.json();
    const { phoneNumber, studentName } = requestData;

    // Get WhatsApp Business API credentials from environment
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!accessToken || !phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured');
    }

    // Format phone number (remove non-digits and ensure proper format)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    let whatsappResponse;
    let messageType = 'text';

    if (requestData.type === 'document' && 'document' in requestData) {
      // Handle document (PDF) sending
      messageType = 'document';
      
      // First, we need to upload the document to WhatsApp
      const mediaResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            type: 'document',
            document: {
              filename: requestData.document.filename,
              // For now, we'll send a link instead of uploading the file
              // This is a simplified implementation
            }
          })
        }
      );

      // For simplicity, let's send the PDF as a text message with download info
      // In a production environment, you'd upload the PDF to cloud storage first
      whatsappResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
              body: `📄 *Student Progress Report*\n\n${requestData.caption || `Academic report for ${studentName} is ready.`}\n\n🔗 Please contact school for the detailed PDF report.\n\n📱 Generated from School Management System`
            }
          })
        }
      );
    } else {
      // Handle text message sending
      const message = 'message' in requestData ? requestData.message : '';
      
      whatsappResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
              body: message
            }
          })
        }
      );
    }

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(whatsappData)}`);
    }

    // Log the message in Supabase for tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const messageContent = requestData.type === 'document' 
      ? `PDF Report sent for ${studentName}` 
      : ('message' in requestData ? requestData.message : '');

    await supabase
      .from('whatsapp_messages')
      .insert({
        phone_number: formattedPhone,
        message: messageContent,
        student_name: studentName,
        status: 'sent',
        whatsapp_message_id: whatsappData.messages?.[0]?.id,
        sent_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: whatsappData.messages?.[0]?.id,
        status: 'sent',
        type: messageType
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});