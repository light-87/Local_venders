/**
 * Multi-language maintenance reminder templates
 * Placeholders: [Customer Name], [Item Name], [Date], [Time Slot], [Business Name]
 */

export type TemplateLanguage = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: TemplateLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const MAINTENANCE_TEMPLATES: Record<TemplateLanguage, string> = {
  en: `Hi [Customer Name],

MAINTENANCE ALERT

Date: [Date]
[Time Slot]

Your [Item Name] needs servicing to keep your drinking water safe.

Skipping maintenance can lead to:
- Impure water
- Bacterial growth
- Filter damage

Let's keep your family healthy!

Reply 1 to Confirm
Reply 2 to Reschedule

[Business Name]`,

  hi: `नमस्ते [Customer Name],

मेंसटेनेंस अलर्ट

दिनांक: [Date] समय: [Time Slot]

आपके [Item Name] की सर्विसिंग का समय हो गया है, ताकि आपको सुरक्षित पीने का पानी मिलता रहे।

सर्विसिंग न कराने से यह दिक्कतें हो सकती हैं:

अशुद्ध पानी

बैक्टीरिया/कीटाणु का बढ़ना

फिल्टर खराब होना

आइए, अपने परिवार की सेहत का खयाल रखें!

कन्फर्म करने के लिए (Confirm) 1 रिप्लाई करें
समय बदलने (Reschedule) के लिए 2 रिप्लाई करें

[Business Name]`,

  mr: `नमस्कार [Customer Name],

देखभाल/मेंसटेनेंस सूचना

दिनांक: [Date] वेळ: [Time Slot]

तुमचे पिण्याचे पाणी सुरक्षित ठेवण्यासाठी तुमच्या [Item Name] ला सर्व्हिसिंगची गरज आहे।

वेळेवर मेंटेनन्स न केल्यास हे होऊ शकते:

अशुद्ध पाणी

बॅक्टेरिया/जंतूंची वाढ

फिल्टर खराब होणे

चला, आपल्या कुटुंबाचे आरोग्य जपूया!

कन्फर्म करण्यासाठी (Confirm) 1 रिप्लाय करा
वेळ बदलण्यासाठी (Reschedule) 2 रिप्लाय करा

[Business Name]`,
};

/**
 * Get default template for a given language
 */
export function getDefaultTemplate(language: TemplateLanguage): string {
  return MAINTENANCE_TEMPLATES[language] || MAINTENANCE_TEMPLATES.en;
}

/**
 * Get language label for display
 */
export function getLanguageLabel(code: TemplateLanguage): string {
  const option = LANGUAGE_OPTIONS.find((opt) => opt.code === code);
  return option ? `${option.nativeLabel} (${option.label})` : 'English';
}
