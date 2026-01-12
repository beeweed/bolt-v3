/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import type { Message } from 'ai';
import React, { type RefCallback, useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { MODEL_LIST, PROVIDER_LIST, initializeModelList } from '~/utils/constants';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { APIKeyManager } from './APIKeyManager';
import Cookies from 'js-cookie';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useStore } from '@nanostores/react';
import { modeStore, setMode, type Mode } from '~/lib/stores/mode';

import type { FileAttachment } from '~/utils/fileUtils';

import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/utils/types';
import { ExamplePrompts } from '~/components/chat/ExamplePrompts';

// @ts-ignore TODO: Introduce proper types
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ModelSelector = ({ model, setModel, provider, setProvider, modelList, providerList, apiKeys }) => {
  return (
    <div className="mb-2 flex gap-2 flex-col sm:flex-row">
      <select
        value={provider?.name}
        onChange={(e) => {
          setProvider(providerList.find((p: ProviderInfo) => p.name === e.target.value));

          const firstModel = [...modelList].find((m) => m.provider == e.target.value);
          setModel(firstModel ? firstModel.name : '');
        }}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
      >
        {providerList.map((provider: ProviderInfo) => (
          <option key={provider.name} value={provider.name}>
            {provider.name}
          </option>
        ))}
      </select>
      <select
        key={provider?.name}
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all lg:max-w-[70%]"
      >
        {[...modelList]
          .filter((e) => e.provider == provider?.name && e.name)
          .map((modelOption) => (
            <option key={modelOption.name} value={modelOption.name}>
              {modelOption.label}
            </option>
          ))}
      </select>
    </div>
  );
};

const TEXTAREA_MIN_HEIGHT = 76;

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  description?: string;
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  attachedFiles?: FileAttachment[];
  onFilesChange?: (files: FileAttachment[]) => void;
}

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      model,
      setModel,
      provider,
      setProvider,
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
      attachedFiles = [],
      onFilesChange,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [modelList, setModelList] = useState(MODEL_LIST);
    const [isModelSettingsCollapsed, setIsModelSettingsCollapsed] = useState(false);
    const currentMode = useStore(modeStore);

    const handleModeChange = (newMode: Mode) => {
      setMode(newMode);

      /*
       * Save to cookie for server-side access
       * Only use secure flag on HTTPS (production), default to true for safety
       */
      const isSecure = typeof window !== 'undefined' ? window.location.protocol === 'https:' : true;
      Cookies.set('bolt_mode', newMode, {
        expires: 30,
        secure: isSecure,
        sameSite: 'strict',
        path: '/',
      });
    };

    useEffect(() => {
      // Load API keys from cookies on component mount
      try {
        const storedApiKeys = Cookies.get('apiKeys');

        if (storedApiKeys) {
          const parsedKeys = JSON.parse(storedApiKeys);

          if (typeof parsedKeys === 'object' && parsedKeys !== null) {
            setApiKeys(parsedKeys);
          }
        }
      } catch (error) {
        console.error('Error loading API keys from cookies:', error);

        // Clear invalid cookie data
        Cookies.remove('apiKeys');
      }

      initializeModelList().then((modelList) => {
        setModelList(modelList);
      });
    }, []);

    const updateApiKey = (provider: string, key: string) => {
      try {
        const updatedApiKeys = { ...apiKeys, [provider]: key };
        setApiKeys(updatedApiKeys);

        // Save updated API keys to cookies with 30 day expiry and secure settings
        Cookies.set('apiKeys', JSON.stringify(updatedApiKeys), {
          expires: 30, // 30 days
          secure: true, // Only send over HTTPS
          sameSite: 'strict', // Protect against CSRF
          path: '/', // Accessible across the site
        });
      } catch (error) {
        console.error('Error saving API keys to cookies:', error);
      }
    };

    const baseChat = (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex flex-col lg:flex-row h-full w-full overflow-hidden bg-bolt-elements-background-depth-1',
        )}
        data-chat-visible={showChat}
      >
        <div className={classNames(styles.RayContainer)}>
          <div className={classNames(styles.LightRayOne)}></div>
          <div className={classNames(styles.LightRayTwo)}></div>
          <div className={classNames(styles.LightRayThree)}></div>
          <div className={classNames(styles.LightRayFour)}></div>
          <div className={classNames(styles.LightRayFive)}></div>
        </div>
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex flex-col lg:flex-row overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow lg:min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[26vh] max-w-chat mx-auto text-center px-4 lg:px-0">
                <h1 className="text-3xl lg:text-6xl font-bold text-bolt-elements-textPrimary mb-4 animate-fade-in">
                  Build anything with AI
                </h1>
                <p className="text-md lg:text-xl mb-8 text-bolt-elements-textSecondary animate-fade-in animation-delay-200">
                  Chat with AI to create full-stack apps in seconds.
                </p>
              </div>
            )}
            <div
              className={classNames('pt-6 px-2 sm:px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat pb-6 mx-auto z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames(
                  'bg-bolt-elements-background-depth-2 p-3 rounded-lg border border-bolt-elements-borderColor relative w-full max-w-chat mx-auto z-prompt mb-6',
                  {
                    'sticky bottom-2': chatStarted,
                  },
                )}
              >
                <svg className={classNames(styles.PromptEffectContainer)}>
                  <defs>
                    <linearGradient
                      id="line-gradient"
                      x1="20%"
                      y1="0%"
                      x2="-14%"
                      y2="10%"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="rotate(-45)"
                    >
                      <stop offset="0%" stopColor="#888888" stopOpacity="0%"></stop>
                      <stop offset="40%" stopColor="#888888" stopOpacity="30%"></stop>
                      <stop offset="50%" stopColor="#888888" stopOpacity="30%"></stop>
                      <stop offset="100%" stopColor="#888888" stopOpacity="0%"></stop>
                    </linearGradient>
                    <linearGradient id="shine-gradient">
                      <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
                      <stop offset="40%" stopColor="#AAAAAA" stopOpacity="30%"></stop>
                      <stop offset="50%" stopColor="#AAAAAA" stopOpacity="30%"></stop>
                      <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
                    </linearGradient>
                  </defs>
                  <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
                  <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
                </svg>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={() => setIsModelSettingsCollapsed(!isModelSettingsCollapsed)}
                      className={classNames('flex items-center gap-2 p-2 rounded-lg transition-all', {
                        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent':
                          isModelSettingsCollapsed,
                        'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault':
                          !isModelSettingsCollapsed,
                      })}
                    >
                      <div className={`i-ph:caret-${isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
                      <span>Model Settings</span>
                    </button>
                  </div>

                  <div className={isModelSettingsCollapsed ? 'hidden' : ''}>
                    <ModelSelector
                      key={provider?.name + ':' + modelList.length}
                      model={model}
                      setModel={setModel}
                      modelList={modelList}
                      provider={provider}
                      setProvider={setProvider}
                      providerList={PROVIDER_LIST}
                      apiKeys={apiKeys}
                    />
                    {provider && (
                      <APIKeyManager
                        provider={provider}
                        apiKey={apiKeys[provider.name] || ''}
                        setApiKey={(key) => updateApiKey(provider.name, key)}
                      />
                    )}
                  </div>
                </div>

                <div
                  className={classNames(
                    'relative shadow-xs border border-bolt-elements-borderColor backdrop-blur rounded-lg',
                  )}
                >
                  {attachedFiles.length > 0 && (
                    <ClientOnly>
                      {() => (
                        <div className="px-4 pt-3">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {attachedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="relative group flex items-center gap-2 px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  {file.type === 'image' ? (
                                    <div className="w-10 h-10 rounded overflow-hidden bg-bolt-elements-background-depth-3">
                                      <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-bolt-elements-background-depth-3 flex items-center justify-center text-bolt-elements-textSecondary">
                                      📄
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-xs text-bolt-elements-textPrimary truncate max-w-[150px]">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-bolt-elements-textSecondary">
                                      {((size: number) => {
                                        if (size < 1024) {
                                          return `${size} B`;
                                        }

                                        if (size < 1024 * 1024) {
                                          return `${(size / 1024).toFixed(1)} KB`;
                                        }

                                        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
                                      })(file.size)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => onFilesChange?.(attachedFiles.filter((_, i) => i !== index))}
                                  className="ml-2 p-1 rounded hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                                  title="Remove file"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </ClientOnly>
                  )}
                  <div className="flex items-start">
                    <textarea
                      ref={textareaRef}
                      className={
                        'w-full pl-2 pt-4 pr-16 focus:outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm'
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          if (event.shiftKey) {
                            return;
                          }

                          event.preventDefault();

                          sendMessage?.(event);
                        }
                      }}
                      value={input}
                      onChange={(event) => {
                        handleInputChange?.(event);
                      }}
                      style={{
                        minHeight: TEXTAREA_MIN_HEIGHT,
                        maxHeight: TEXTAREA_MAX_HEIGHT,
                      }}
                      placeholder="How can Bolt help you today?"
                      translate="no"
                    />
                  </div>
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || attachedFiles.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          sendMessage?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  <div className="flex justify-between items-center text-sm p-4 pt-2">
                    <div className="flex gap-1 items-center">
                      <ClientOnly>
                        {() =>
                          onFilesChange ? (
                            <>
                              <input
                                type="file"
                                id="file-upload-bottom"
                                onChange={async (e) => {
                                  const selectedFiles = Array.from(e.target.files || []);
                                  const newFiles: any[] = [];
                                  const MAX_FILE_SIZE = 10 * 1024 * 1024;
                                  const ACCEPTED_FILE_TYPES = [
                                    'image/jpeg',
                                    'image/png',
                                    'image/gif',
                                    'image/webp',
                                    'image/svg+xml',
                                  ];

                                  for (const file of selectedFiles) {
                                    if (file.size > MAX_FILE_SIZE) {
                                      console.error(`File ${file.name} is too large`);
                                      continue;
                                    }

                                    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                                      console.error(`File type ${file.type} is not supported`);
                                      continue;
                                    }

                                    try {
                                      const base64Data = await new Promise<string>((resolve, reject) => {
                                        const reader = new FileReader();
                                        reader.onload = () => resolve(reader.result as string);
                                        reader.onerror = reject;
                                        reader.readAsDataURL(file);
                                      });
                                      newFiles.push({
                                        name: file.name,
                                        size: file.size,
                                        type: file.type.startsWith('image/') ? 'image' : 'file',
                                        data: base64Data,
                                      });
                                    } catch {
                                      console.error(`Failed to process file ${file.name}`);
                                    }
                                  }

                                  if (newFiles.length > 0) {
                                    onFilesChange([...attachedFiles, ...newFiles]);
                                  }

                                  e.target.value = '';
                                }}
                                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                multiple
                                className="hidden"
                                disabled={isStreaming}
                              />
                              <IconButton
                                title="Upload files or images"
                                disabled={isStreaming}
                                onClick={() => document.getElementById('file-upload-bottom')?.click()}
                                className="transition-all"
                              >
                                <div className="i-ph:paperclip text-xl"></div>
                              </IconButton>
                            </>
                          ) : null
                        }
                      </ClientOnly>
                      <IconButton
                        title="Enhance prompt"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames('transition-all', {
                          'opacity-100!': enhancingPrompt,
                          'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!':
                            promptEnhanced,
                        })}
                        onClick={() => enhancePrompt?.()}
                      >
                        {enhancingPrompt ? (
                          <>
                            <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl animate-spin"></div>
                            <div className="ml-1.5">Enhancing prompt...</div>
                          </>
                        ) : (
                          <>
                            <div className="i-bolt:stars text-xl"></div>
                            {promptEnhanced && <div className="ml-1.5">Prompt enhanced</div>}
                          </>
                        )}
                      </IconButton>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={currentMode}
                        onChange={(e) => handleModeChange(e.target.value as Mode)}
                        className="px-2 py-1 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary text-xs focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
                        title={
                          currentMode === 'build'
                            ? 'Build Mode: AI creates and updates code'
                            : 'Chat Mode: Ask questions about your project'
                        }
                      >
                        <option value="build">⚡ Build Mode</option>
                        <option value="chat">💬 Chat Mode</option>
                      </select>
                      {input.length > 3 ? (
                        <div className="text-xs text-bolt-elements-textTertiary">
                          Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd>{' '}
                          + <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Return</kbd>{' '}
                          for new line
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {!chatStarted && ExamplePrompts(sendMessage)}
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );

    return <Tooltip.Provider delayDuration={200}>{baseChat}</Tooltip.Provider>;
  },
);
