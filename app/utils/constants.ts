import type { ModelInfo, OllamaApiResponse, OllamaModel } from './types';
import type { ProviderInfo } from '~/types/model';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'bolt_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = 'claude-sonnet-4-5';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';

const PROVIDER_LIST: ProviderInfo[] = [
  {
    name: 'Anthropic',
    staticModels: [
      {
        name: 'claude-sonnet-4-5',
        label: 'Claude Sonnet 4.5 (Best Coding)',
        provider: 'Anthropic',
        maxTokenAllowed: 8000,
      },
      {
        name: 'claude-haiku-4-5',
        label: 'Claude Haiku 4.5 (Fast & Efficient)',
        provider: 'Anthropic',
        maxTokenAllowed: 8000,
      },
      {
        name: 'claude-opus-4-1-20250805',
        label: 'Claude Opus 4.1 (Deep Reasoning)',
        provider: 'Anthropic',
        maxTokenAllowed: 8000,
      },
      { name: 'claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'Anthropic', maxTokenAllowed: 8000 },
      { name: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', provider: 'Anthropic', maxTokenAllowed: 8000 },
      { name: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', provider: 'Anthropic', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://console.anthropic.com/settings/keys',
  },
  {
    name: 'Ollama',
    staticModels: [],
    getDynamicModels: getOllamaModels,
    getApiKeyLink: 'https://ollama.com/download',
    labelForGetApiKey: 'Download Ollama',
    icon: 'i-ph:cloud-arrow-down',
  },
  {
    name: 'OpenAILike',
    staticModels: [],
    getDynamicModels: getOpenAILikeModels,
  },
  {
    name: 'Cohere',
    staticModels: [
      { name: 'command-a-03-2025', label: 'Command A (Latest Flagship)', provider: 'Cohere', maxTokenAllowed: 8000 },
      { name: 'command-a-reasoning', label: 'Command A Reasoning', provider: 'Cohere', maxTokenAllowed: 8000 },
      { name: 'command-r-plus-08-2024', label: 'Command R Plus', provider: 'Cohere', maxTokenAllowed: 4096 },
      { name: 'command-r-08-2024', label: 'Command R', provider: 'Cohere', maxTokenAllowed: 4096 },
      {
        name: 'c4ai-aya-expanse-32b',
        label: 'Aya Expanse 32b (Multilingual)',
        provider: 'Cohere',
        maxTokenAllowed: 4096,
      },
      { name: 'c4ai-aya-expanse-8b', label: 'Aya Expanse 8b', provider: 'Cohere', maxTokenAllowed: 4096 },
    ],
    getApiKeyLink: 'https://dashboard.cohere.com/api-keys',
  },
  {
    name: 'OpenRouter',
    staticModels: [
      { name: 'openai/o1', label: 'GPT-5 (OpenRouter)', provider: 'OpenRouter', maxTokenAllowed: 8000 },
      { name: 'openai/gpt-4o', label: 'GPT-4.1 (OpenRouter)', provider: 'OpenRouter', maxTokenAllowed: 8000 },
      {
        name: 'anthropic/claude-sonnet-4-5',
        label: 'Claude Sonnet 4.5 (OpenRouter)',
        provider: 'OpenRouter',
        maxTokenAllowed: 8000,
      },
      {
        name: 'anthropic/claude-haiku-4-5',
        label: 'Claude Haiku 4.5 (OpenRouter)',
        provider: 'OpenRouter',
        maxTokenAllowed: 8000,
      },
      {
        name: 'google/gemini-2.0-flash',
        label: 'Gemini 2.0 Flash (OpenRouter)',
        provider: 'OpenRouter',
        maxTokenAllowed: 8000,
      },
      {
        name: 'deepseek/deepseek-chat-v3.2',
        label: 'DeepSeek Chat V3.2 (OpenRouter)',
        provider: 'OpenRouter',
        maxTokenAllowed: 8000,
      },
      {
        name: 'mistralai/mistral-large-2411',
        label: 'Mistral Large 24.11 (OpenRouter)',
        provider: 'OpenRouter',
        maxTokenAllowed: 8000,
      },
      { name: 'x-ai/grok-beta', label: 'xAI Grok Beta (OpenRouter)', provider: 'OpenRouter', maxTokenAllowed: 8000 },
    ],
    getDynamicModels: getOpenRouterModels,
    getApiKeyLink: 'https://openrouter.ai/settings/keys',
  },
  {
    name: 'Google',
    staticModels: [
      { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google', maxTokenAllowed: 8192 },
      {
        name: 'gemini-2.0-flash-exp',
        label: 'Gemini 2.0 Flash Experimental',
        provider: 'Google',
        maxTokenAllowed: 8192,
      },
      { name: 'gemini-exp-1206', label: 'Gemini Experimental 1206', provider: 'Google', maxTokenAllowed: 8192 },
      {
        name: 'gemini-2.0-flash-thinking-exp',
        label: 'Gemini 2.0 Flash Thinking',
        provider: 'Google',
        maxTokenAllowed: 8192,
      },
    ],
    getApiKeyLink: 'https://aistudio.google.com/app/apikey',
  },
  {
    name: 'Groq',
    staticModels: [
      { name: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70b (Latest)', provider: 'Groq', maxTokenAllowed: 8000 },
      { name: 'llama-3.3-70b-specdec', label: 'Llama 3.3 70b (Faster)', provider: 'Groq', maxTokenAllowed: 8000 },
      {
        name: 'deepseek-r1-distill-llama-70b',
        label: 'DeepSeek R1 Llama 70b (Reasoning)',
        provider: 'Groq',
        maxTokenAllowed: 8000,
      },
      {
        name: 'deepseek-r1-distill-qwen-32b',
        label: 'DeepSeek R1 Qwen 32b (Coding)',
        provider: 'Groq',
        maxTokenAllowed: 8000,
      },
      { name: 'llama-3.1-8b-instant', label: 'Llama 3.1 8b (Fast)', provider: 'Groq', maxTokenAllowed: 8000 },
      { name: 'llama-3-groq-70b-tool-use', label: 'Llama 3 70b (Tool Use)', provider: 'Groq', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://console.groq.com/keys',
  },
  {
    name: 'HuggingFace',
    staticModels: [
      {
        name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        label: 'Qwen2.5-Coder-32B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: '01-ai/Yi-1.5-34B-Chat',
        label: 'Yi-1.5-34B-Chat (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'codellama/CodeLlama-34b-Instruct-hf',
        label: 'CodeLlama-34b-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'NousResearch/Hermes-3-Llama-3.1-8B',
        label: 'Hermes-3-Llama-3.1-8B (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        label: 'Qwen2.5-Coder-32B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'Qwen/Qwen2.5-72B-Instruct',
        label: 'Qwen2.5-72B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'meta-llama/Llama-3.1-70B-Instruct',
        label: 'Llama-3.1-70B-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'meta-llama/Llama-3.1-405B',
        label: 'Llama-3.1-405B (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: '01-ai/Yi-1.5-34B-Chat',
        label: 'Yi-1.5-34B-Chat (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'codellama/CodeLlama-34b-Instruct-hf',
        label: 'CodeLlama-34b-Instruct (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
      {
        name: 'NousResearch/Hermes-3-Llama-3.1-8B',
        label: 'Hermes-3-Llama-3.1-8B (HuggingFace)',
        provider: 'HuggingFace',
        maxTokenAllowed: 8000,
      },
    ],
    getApiKeyLink: 'https://huggingface.co/settings/tokens',
  },

  {
    name: 'OpenAI',
    staticModels: [
      { name: 'o1', label: 'GPT-5 (Latest Reasoning)', provider: 'OpenAI', maxTokenAllowed: 8000 },
      { name: 'o1-pro', label: 'GPT-5 Pro (Extended Reasoning)', provider: 'OpenAI', maxTokenAllowed: 8000 },
      { name: 'o1-mini', label: 'GPT-5 Mini (Fast Reasoning)', provider: 'OpenAI', maxTokenAllowed: 8000 },
      { name: 'gpt-4o', label: 'GPT-4.1 (Multimodal)', provider: 'OpenAI', maxTokenAllowed: 8000 },
      { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://platform.openai.com/api-keys',
  },
  {
    name: 'xAI',
    staticModels: [{ name: 'grok-beta', label: 'xAI Grok Beta', provider: 'xAI', maxTokenAllowed: 8000 }],
    getApiKeyLink: 'https://docs.x.ai/docs/quickstart#creating-an-api-key',
  },
  {
    name: 'Deepseek',
    staticModels: [
      { name: 'deepseek-chat-v3.2', label: 'DeepSeek Chat V3.2 (Latest)', provider: 'Deepseek', maxTokenAllowed: 8000 },
      {
        name: 'deepseek-chat-v3.1',
        label: 'DeepSeek Chat V3.1 (Hybrid Reasoning)',
        provider: 'Deepseek',
        maxTokenAllowed: 8000,
      },
      { name: 'deepseek-coder', label: 'DeepSeek Coder', provider: 'Deepseek', maxTokenAllowed: 8000 },
      { name: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'Deepseek', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://platform.deepseek.com/apiKeys',
  },
  {
    name: 'Mistral',
    staticModels: [
      { name: 'mistral-large-2411', label: 'Mistral Large 24.11 (Latest)', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'pixtral-large-latest', label: 'Pixtral Large (Multimodal)', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'mistral-medium-3', label: 'Mistral Medium 3', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'mistral-small-3-1', label: 'Mistral Small 3.1', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'codestral-2501', label: 'Codestral 25.01 (Coding)', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'ministral-8b-latest', label: 'Ministral 8B', provider: 'Mistral', maxTokenAllowed: 8000 },
      { name: 'ministral-3b-latest', label: 'Ministral 3B (Edge)', provider: 'Mistral', maxTokenAllowed: 8000 },
    ],
    getApiKeyLink: 'https://console.mistral.ai/api-keys/',
  },
  {
    name: 'LMStudio',
    staticModels: [],
    getDynamicModels: getLMStudioModels,
    getApiKeyLink: 'https://lmstudio.ai/',
    labelForGetApiKey: 'Get LMStudio',
    icon: 'i-ph:cloud-arrow-down',
  },
  {
    name: 'Together',
    staticModels: [
      {
        name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        label: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        provider: 'Together',
        maxTokenAllowed: 8000,
      },
      {
        name: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        label: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        provider: 'Together',
        maxTokenAllowed: 8000,
      },

      {
        name: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        label: 'Mixtral 8x7B Instruct',
        provider: 'Together',
        maxTokenAllowed: 8192,
      },
    ],
    getApiKeyLink: 'https://api.together.xyz/settings/api-keys',
  },
];

export const DEFAULT_PROVIDER = PROVIDER_LIST[0];

const staticModels: ModelInfo[] = PROVIDER_LIST.map((p) => p.staticModels).flat();

export let MODEL_LIST: ModelInfo[] = [...staticModels];

const getOllamaBaseUrl = () => {
  const defaultBaseUrl = import.meta.env.OLLAMA_API_BASE_URL || 'http://localhost:11434';

  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Frontend always uses localhost
    return defaultBaseUrl;
  }

  // Backend: Check if we're running in Docker
  const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

  return isDocker ? defaultBaseUrl.replace('localhost', 'host.docker.internal') : defaultBaseUrl;
};

async function getOllamaModels(): Promise<ModelInfo[]> {
  /*
   * if (typeof window === 'undefined') {
   * return [];
   * }
   */

  try {
    const baseUrl = getOllamaBaseUrl();
    const response = await fetch(`${baseUrl}/api/tags`);
    const data = (await response.json()) as OllamaApiResponse;

    return data.models.map((model: OllamaModel) => ({
      name: model.name,
      label: `${model.name} (${model.details.parameter_size})`,
      provider: 'Ollama',
      maxTokenAllowed: 8000,
    }));
  } catch (e) {
    console.error('Error getting Ollama models:', e);
    return [];
  }
}

async function getOpenAILikeModels(): Promise<ModelInfo[]> {
  try {
    const baseUrl = import.meta.env.OPENAI_LIKE_API_BASE_URL || '';

    if (!baseUrl) {
      return [];
    }

    const apiKey = import.meta.env.OPENAI_LIKE_API_KEY ?? '';
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const res = (await response.json()) as any;

    return res.data.map((model: any) => ({
      name: model.id,
      label: model.id,
      provider: 'OpenAILike',
    }));
  } catch (e) {
    console.error('Error getting OpenAILike models:', e);
    return [];
  }
}

type OpenRouterModelsResponse = {
  data: {
    name: string;
    id: string;
    context_length: number;
    pricing: {
      prompt: number;
      completion: number;
    };
  }[];
};

async function getOpenRouterModels(): Promise<ModelInfo[]> {
  const data: OpenRouterModelsResponse = await (
    await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  ).json();

  return data.data
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({
      name: m.id,
      label: `${m.name} - in:$${(m.pricing.prompt * 1_000_000).toFixed(
        2,
      )} out:$${(m.pricing.completion * 1_000_000).toFixed(2)} - context ${Math.floor(m.context_length / 1000)}k`,
      provider: 'OpenRouter',
      maxTokenAllowed: 8000,
    }));
}

async function getLMStudioModels(): Promise<ModelInfo[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const baseUrl = import.meta.env.LMSTUDIO_API_BASE_URL || 'http://localhost:1234';
    const response = await fetch(`${baseUrl}/v1/models`);
    const data = (await response.json()) as any;

    return data.data.map((model: any) => ({
      name: model.id,
      label: model.id,
      provider: 'LMStudio',
    }));
  } catch (e) {
    console.error('Error getting LMStudio models:', e);
    return [];
  }
}

async function initializeModelList(): Promise<ModelInfo[]> {
  MODEL_LIST = [
    ...(
      await Promise.all(
        PROVIDER_LIST.filter(
          (p): p is ProviderInfo & { getDynamicModels: () => Promise<ModelInfo[]> } => !!p.getDynamicModels,
        ).map((p) => p.getDynamicModels()),
      )
    ).flat(),
    ...staticModels,
  ];
  return MODEL_LIST;
}

export {
  getOllamaModels,
  getOpenAILikeModels,
  getLMStudioModels,
  initializeModelList,
  getOpenRouterModels,
  PROVIDER_LIST,
};
