// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck – TODO: Provider proper types

import { convertToCoreMessages, streamText as _streamText } from 'ai';
import { getModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, MODEL_LIST, MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';
import { getTools } from './tools';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

export interface ImageContent {
  type: 'image';
  image: string; // base64 data URL
}

export interface TextContent {
  type: 'text';
  text: string;
}

export type MessageContent = string | Array<TextContent | ImageContent>;

interface Message {
  role: 'user' | 'assistant';
  content: MessageContent;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
  model?: string;
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

function extractPropertiesFromMessage(message: Message): { model: string; provider: string; content: MessageContent } {
  let textContent = '';
  
  // Extract text content from message
  if (typeof message.content === 'string') {
    textContent = message.content;
  } else if (Array.isArray(message.content)) {
    const textPart = message.content.find((part) => part.type === 'text') as TextContent | undefined;
    textContent = textPart?.text || '';
  }

  // Extract model
  const modelMatch = textContent.match(MODEL_REGEX);
  const model = modelMatch ? modelMatch[1] : DEFAULT_MODEL;

  // Extract provider
  const providerMatch = textContent.match(PROVIDER_REGEX);
  const provider = providerMatch ? providerMatch[1] : DEFAULT_PROVIDER;

  // Remove model and provider lines from content
  const cleanedTextContent = textContent.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '').trim();

  // Reconstruct content with cleaned text
  let cleanedContent: MessageContent;
  if (typeof message.content === 'string') {
    cleanedContent = cleanedTextContent;
  } else if (Array.isArray(message.content)) {
    cleanedContent = message.content.map((part) => {
      if (part.type === 'text') {
        return { type: 'text', text: cleanedTextContent };
      }
      return part;
    });
  } else {
    cleanedContent = cleanedTextContent;
  }

  return { model, provider, content: cleanedContent };
}

export function streamText(
  messages: Messages, 
  env: Env, 
  options?: StreamingOptions, 
  apiKeys?: Record<string, string>, 
  mode?: 'build' | 'chat',
  enableWebSearch?: boolean
) {
  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER;

  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);

      if (MODEL_LIST.find((m) => m.name === model)) {
        currentModel = model;
      }

      currentProvider = provider;

      return { ...message, content };
    }

    return message;
  });

  const modelDetails = MODEL_LIST.find((m) => m.name === currentModel);

  const dynamicMaxTokens = modelDetails && modelDetails.maxTokenAllowed ? modelDetails.maxTokenAllowed : MAX_TOKENS;

  return _streamText({
    model: getModel(currentProvider, currentModel, env, apiKeys),
    system: getSystemPrompt(undefined, mode),
    maxTokens: dynamicMaxTokens,
    messages: convertToCoreMessages(processedMessages),
    ...options,
  });
}
