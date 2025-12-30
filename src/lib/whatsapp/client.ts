/**
 * WhatsApp Cloud API Client
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_API_VERSION = 'v21.0';
const WHATSAPP_API_BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface WhatsAppTemplateParameter {
  type: 'text';
  text: string;
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: WhatsAppTemplateParameter[];
  sub_type?: 'quick_reply' | 'url';
  index?: number;
}

export interface SendTemplateMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string; // Phone number with country code (no + sign)
  templateName: string;
  languageCode?: string;
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: number;
}

/**
 * Format phone number for WhatsApp API
 * Removes + sign and spaces, ensures country code
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');

  // If it's a 10-digit Indian number, add 91
  if (digits.length === 10) {
    digits = '91' + digits;
  }

  return digits;
}

/**
 * Send a template message via WhatsApp Cloud API
 */
export async function sendTemplateMessage(
  params: SendTemplateMessageParams
): Promise<SendMessageResult> {
  const { phoneNumberId, accessToken, to, templateName, languageCode = 'en', components } = params;

  const url = `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/messages`;

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: formatPhoneForWhatsApp(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };

  // Add components if provided (for template parameters)
  if (components && components.length > 0) {
    (body.template as Record<string, unknown>).components = components;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as WhatsAppApiError;
      return {
        success: false,
        error: errorData.error?.message || 'Failed to send message',
        errorCode: errorData.error?.code,
      };
    }

    const successData = data as WhatsAppApiResponse;
    return {
      success: true,
      messageId: successData.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Send a template message with body parameters
 * This is a convenience function for common use case
 */
export async function sendTemplateWithBodyParams(
  params: Omit<SendTemplateMessageParams, 'components'> & {
    bodyParams: string[];
  }
): Promise<SendMessageResult> {
  const { bodyParams, ...rest } = params;

  const components: WhatsAppTemplateComponent[] = [];

  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams.map((text) => ({ type: 'text', text })),
    });
  }

  return sendTemplateMessage({ ...rest, components });
}

/**
 * Verify WhatsApp credentials by fetching phone number info
 */
export async function verifyCredentials(
  phoneNumberId: string,
  accessToken: string
): Promise<{ success: boolean; phoneNumber?: string; verifiedName?: string; error?: string }> {
  const url = `${WHATSAPP_API_BASE_URL}/${phoneNumberId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Invalid credentials',
      };
    }

    return {
      success: true,
      phoneNumber: data.display_phone_number,
      verifiedName: data.verified_name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Get available message templates for a WhatsApp Business Account
 */
export async function getTemplates(
  whatsappBusinessAccountId: string,
  accessToken: string
): Promise<{ success: boolean; templates?: Array<{ name: string; status: string; category: string }>; error?: string }> {
  const url = `${WHATSAPP_API_BASE_URL}/${whatsappBusinessAccountId}/message_templates`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Failed to fetch templates',
      };
    }

    return {
      success: true,
      templates: data.data?.map((t: { name: string; status: string; category: string }) => ({
        name: t.name,
        status: t.status,
        category: t.category,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
