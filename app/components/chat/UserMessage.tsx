/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { modificationsRegex } from '~/utils/diff';
import { MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';
import { Markdown } from './Markdown';

interface UserMessageProps {
  content: string | Array<{ type: string; text?: string; image?: string }>;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="overflow-hidden pt-[4px]">
      <Markdown limitedMarkdown>{sanitizeUserMessage(content)}</Markdown>
    </div>
  );
}

function sanitizeUserMessage(content: string | Array<{ type: string; text?: string; image?: string }>) {
  // Handle multimodal content (array with text and images)
  if (Array.isArray(content)) {
    const textPart = content.find((part) => part.type === 'text');
    const textContent = textPart?.text || '';
    const imageParts = content.filter((part) => part.type === 'image');

    const sanitizedText = textContent
      .replace(modificationsRegex, '')
      .replace(MODEL_REGEX, 'Using: $1')
      .replace(PROVIDER_REGEX, ' ($1)\n\n')
      .trim();

    // Add image indicators
    const imageIndicators = imageParts.map((_, index) => `📎 Image ${index + 1}`).join('\n');

    return imageIndicators ? `${sanitizedText}\n\n${imageIndicators}` : sanitizedText;
  }

  // Handle string content
  return content
    .replace(modificationsRegex, '')
    .replace(MODEL_REGEX, 'Using: $1')
    .replace(PROVIDER_REGEX, ' ($1)\n\n')
    .trim();
}
