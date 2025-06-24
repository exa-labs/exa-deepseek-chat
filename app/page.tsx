'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { getAssetPath } from './utils';
import Image from 'next/image';

interface SearchResult {
  title: string;
  url: string;
  text: string;
  author?: string;
  publishedDate?: string;
  favicon?: string;
}

// Add this helper function before the Page component
const parseMessageContent = (content: string) => {
  // If we find a complete think tag
  if (content.includes('</think>')) {
    const [thinking, ...rest] = content.split('</think>');
    return {
      thinking: thinking.replace('<think>', '').trim(),
      finalResponse: rest.join('</think>').trim(),
      isComplete: true
    };
  }
  // If we only find opening think tag, everything after it is thinking
  if (content.includes('<think>')) {
    return {
      thinking: content.replace('<think>', '').trim(),
      finalResponse: '',
      isComplete: false
    };
  }
  // No think tags, everything is final response
  return {
    thinking: '',
    finalResponse: content,
    isComplete: true
  };
};

export default function Page() {
  const [isSearching, setIsSearching] = useState(false);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [previousQueries, setPreviousQueries] = useState<string[]>([]);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [loadingDots, setLoadingDots] = useState('');
  const [showModelNotice, setShowModelNotice] = useState(true);
  const [hasConversationStarted, setHasConversationStarted] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkContainer = () => {
      const container = document.getElementById('demo-clarity-chat-ad-infeed');
      if (container && searchResults.length > 0) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          // @ts-ignore
          window.stratos?.queue.push(function() {
            // @ts-ignore
            window.stratos.renderAds();
          });
        }, 100);
      }
    };

    // Check when searchResults change
    checkContainer();

    // Also set up a mutation observer to watch for container being added
    const observer = new MutationObserver(checkContainer);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [searchResults]);

  useEffect(() => {
    
    let interval: NodeJS.Timeout;
    if (isSearching) {
      let count = 0;
      interval = setInterval(() => {
        count = (count + 1) % 4;
        setLoadingDots('.'.repeat(count));
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSearching]);

  // Add this new useEffect for ads initialization
  useEffect(() => {
    // @ts-ignore
    window.stratosSettings = {
      publisherId: '6660be5c4e70d17b07751c91', // prod demo publisher id
      disableInitialLoad: true,
      hideSkeleton: true,
      adSlots: [
        {
          adUnitCode: 'demo-clarity-chat-ad-infeed',
          adFormat: 'chat',
          size: [300, 600],
        }
      ],
      apiEndpoint: '/api/proxy-ads',
      cssOverrides:
        `:root {
          --background: transparent;
          --text: #404040;
          --header: #525252;
          --header-background: rgba(255, 255, 255, 0.9);
          --title: #0066cc;
          --highlight: #e5f0ff;
          --action-button: #0066cc;
          --question-bubble: rgba(255, 255, 255, 0.9);
          --radius: 8px;
          --user-chat: #0066cc;
          --system-chat: rgba(255, 255, 255, 0.9);
        }

        .ad-container {
          background: transparent;
          font-family: var(--font-abcd-diatype), sans-serif;
        }
        .ad-border-wrapper {
          border: none
        }
        .ad-header {
          font-family: var(--font-abcd-diatype), sans-serif;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 102, 204, 0.1);
        }

        .headline {
          font-family: var(--font-abcd-diatype), sans-serif;
          font-weight: 500;
        }
          
        .ad-questions {
          flex-direction: column;
        }

        .ad-questions li {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 102, 204, 0.1);
          border-left: 2px solid rgba(0, 102, 204, 0.3);
          box-shadow: 0 1px 3px rgba(0, 102, 204, 0.05);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .ad-questions li:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 2px;
          background: #0066cc;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .ad-questions li:hover {
          background: var(--highlight);
          color: var(--brand-default);
          border-left-color: transparent;
        }

        .ad-questions li:hover:before {
          opacity: 1;
        }

        .chat-bubble.user-message {
          color: #000000;
        }

        .ad-input-container {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 102, 204, 0.1);
          border-left: 2px solid rgba(0, 102, 204, 0.3);
          box-shadow: 0 1px 3px rgba(0, 102, 204, 0.05);
        }

        .ad-input input {
          font-family: var(--font-abcd-diatype), sans-serif;
        }

        #visit-site-link {
          background: linear-gradient(135deg, #0066cc, #0052a3);
          border: 1px solid rgba(0, 102, 204, 0.2);
          box-shadow: 0 2px 4px rgba(0, 102, 204, 0.1);
          color: #ffffff;
          font-family: var(--font-abcd-diatype), sans-serif;
          transition: all 0.3s ease;
        }

        #visit-site-link:hover {
          background: var(--highlight);
          color: var(--brand-default);
        }

        .chat-bubble {
          background: rgba(138, 181, 223, 0.1);
          border: 1px solid rgba(0, 102, 204, 0.1);
          box-shadow: 0 1px 3px rgba(0, 102, 204, 0.1);
        }

        .user-message {
          background: var(--brand-default);
          color: #ffffff;
        }

        .loading-chat-bubble {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 102, 204, 0.1);
          border-left: 2px solid rgba(0, 102, 204, 0.3);
          box-shadow: 0 1px 3px rgba(0, 102, 204, 0.05);
          padding: 12px 16px;
          border-radius: var(--radius);
        }

        .dot {
          background-color: #0066cc;
          opacity: 0.6;
          width: 6px;
          height: 6px;
          margin: 0 3px;
        }

        .dot:nth-child(2) {
          opacity: 0.8;
        }

        .dot:nth-child(3) {
          opacity: 1;
        }`
    };

    // @ts-ignore
    window.stratos = window.stratos || { queue: [] };
    // @ts-ignore
    window.stratos.queue.push(function() {
      console.log('Stratos initialized!')
    });
  }, []);

  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, setMessages } = useChat({
    api: getAssetPath('/api/chat'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Set conversation as started on first submit
    if (!hasConversationStarted) {
      setHasConversationStarted(true);
      setBgOpacity(0.2);
      setOverlayOpacity(0.9);
    }

    // Reset states
    setIsSearching(true);
    setIsLLMLoading(false);
    setSearchResults([]);
    setSearchError(null);

    // Add the user's message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);

    // Call getAds immediately with the search input
    // @ts-ignore
    window.stratos.queue.push(function() {
      // @ts-ignore
      window.stratos.getAds(input, true);
    });

    try {
      // First, get web search results
      const searchResponse = await fetch(getAssetPath('/api/exawebsearch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: input,
          previousQueries: previousQueries.slice(-3)
        }),
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const { results } = await searchResponse.json();
      setSearchResults(results);
      // Hide the notice when search results appear
      setShowModelNotice(false);
      setIsSearching(false);
      setIsLLMLoading(true);

      // Format search context
      const searchContext = results.length > 0
        ? `Web Search Results:\n\n${results.map((r: SearchResult, i: number) => 
            `Source [${i + 1}]:\nTitle: ${r.title}\nURL: ${r.url}\n${r.author ? `Author: ${r.author}\n` : ''}${r.publishedDate ? `Date: ${r.publishedDate}\n` : ''}Content: ${r.text}\n---`
          ).join('\n\n')}\n\nInstructions: Based on the above search results, please provide an answer to the user's query. When referencing information, cite the source number in brackets like [1], [2], etc. Use simple english and simple words. Most important: Before coming to the final answer, think out loud, and think step by step. Think deeply, and review your steps, do 3-5 steps of thinking. Wrap the thinking in <think> tags. Start with <think> and end with </think> and then the final answer.`
        : '';

      // Send both system context and user message in one request
      if (searchContext) {
        // First, update the messages state with both messages
        const newMessages: Message[] = [
          ...messages,
          {
            id: Date.now().toString(),
            role: 'system',
            content: searchContext
          }
        ];
        setMessages(newMessages);
      }

      // Then trigger the API call
      handleChatSubmit(e);

      // Update previous queries after successful search
      setPreviousQueries(prev => [...prev, input].slice(-3));

    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error:', err);
      setIsLLMLoading(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Add effect to watch for complete responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const { isComplete } = parseMessageContent(lastMessage.content);
      if (isComplete) {
        setIsLLMLoading(false);
      }
    }
  }, [messages]);

  return (
    <>
      {/* Overlay */}
      <div
        className="overlay"
        style={{ backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})` }}
      />

      {/* Wrap existing content */}
      <div className="content-wrapper">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
          <div className="md:max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="font-codec-cold text-xl tracking-tighter">
                Freeseek
              </h1>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="min-h-screen bg-transparent">
          {!hasConversationStarted ? (
            // Centered initial state
            <div className="h-screen flex flex-col items-center justify-center px-6">
              <div className="w-full max-w-3xl space-y-8 text-center">
                <h1 className="text-4xl font-serif text-gray-800 mb-12 tracking-tight">
                  What do you seek?
                </h1>
                <form
                  onSubmit={handleSubmit}
                  className="w-full flex justify-center"
                >
                  <div className="w-full max-w-2xl">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask anything"
                      autoFocus
                      className="flex-1 p-8 retro-input rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 text-xl transition-all"
                    />
                  </div>
                </form>
              </div>
            </div>
          ) : (
            // Conversation state with two-column layout
            <div className="flex justify-center h-screen pt-20 gap-x-8">
              {/* Left Sidebar for Ad */}
              {searchResults.length > 0 && (
                <div className="w-[380px] flex-shrink-0 pt-20 hidden lg:block">
                  <div className="sticky top-24">
                    <div className="rounded-lg border border-gray-200 bg-white/60 backdrop-blur-md p-4 shadow-sm">
                      <h2 className="font-bold text-lg text-[#69c4ea] mb-3">Related</h2>
                      <div 
                        id="demo-clarity-chat-ad-infeed" 
                        ref={adContainerRef} 
                        className="min-h-[600px]"
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main content area */}
              <div className="w-[768px] flex flex-col">
                <div className="flex-1 overflow-y-auto pb-24">
                  <div className="p-6 space-y-6">
                    {messages.filter(m => m.role !== 'system').map((message) => (
                      <div key={message.id}>
                        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-lg py-3 max-w-[85%] geometric-panel ${
                            message.role === 'user'
                              ? 'bg-white text-black px-4'
                              : 'bg-[#0066cc]/5 text-gray-800 px-4'
                          }`}>
                            {message.role === 'assistant' ? (
                              <>
                                {(() => {
                                  const { thinking, finalResponse, isComplete } = parseMessageContent(message.content);
                                  return (
                                    <>
                                      {(thinking || !isComplete) && (
                                        <div className="mb-10 space-y-4">
                                          <div className="flex items-center gap-2">
                                            <button 
                                              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                                              className="flex items-center gap-2"
                                            >
                                              <svg 
                                                className={`w-5 h-5 transform hover:text-[var(--brand-default)] transition-colors transition-transform ${isThinkingExpanded ? 'rotate-0' : '-rotate-180'}`} 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                stroke="currentColor"
                                              >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                              </svg>
                                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                              </svg>
                                              <h3 className="text-md font-medium">Thinking</h3>
                                            </button>
                                          </div>
                                          {isThinkingExpanded && (
                                            <div className="pl-4 relative">
                                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                                <div className="text-sm text-gray-600 whitespace-pre-wrap">{thinking}</div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {isComplete && finalResponse && (
                                        <div className="prose prose-base max-w-none px-4 text-gray-800 text-base">
                                          <ReactMarkdown>{finalResponse}</ReactMarkdown>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <div className="whitespace-pre-wrap text-[15px]">{message.content}</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Search results section */}
                        {message.role === 'user' && (
                          <div className="my-6 space-y-4">
                            {/* Ad container moved to the sidebar */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                                className="flex items-center gap-2 text-[#69c4ea] hover:text-[#5ab3d9] transition-colors"
                              >
                                <svg 
                                  className={`w-5 h-5 transform transition-transform ${isSourcesExpanded ? 'rotate-0' : '-rotate-180'}`} 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <div className="bounce-hover font-bold text-lg">Seeking...</div>
                              </button>
                            </div>

                            {isSourcesExpanded && (
                              <div className="pl-4 relative">
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                <div className="space-y-2">
                                  {isSearching && !searchResults.length && (
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>Searching web for relevant information...</span>
                                    </div>
                                  )}
                                  {searchResults.map((result, idx) => (
                                    <div key={idx} className="text-sm group relative">
                                      <a href={result.url} 
                                         target="_blank" 
                                         className="text-gray-600 hover:text-[var(--brand-default)] flex items-center gap-2">
                                        [{idx + 1}] {result.title}
                                        {result.favicon && (
                                          <img 
                                            src={result.favicon} 
                                            alt=""
                                            className="w-4 h-4 object-contain"
                                          />
                                        )}
                                      </a>
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-6 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                        {result.url}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isLLMLoading && (
                              <div className="pt-6 flex items-center gap-2 text-[var(--brand-default)]">
                                <div className="loading-chat-bubble">
                                  <div className="dot"></div>
                                  <div className="dot"></div>
                                  <div className="dot"></div>
                                </div>
                                <span className="text-sm">Seeking...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Floating input bar */}
                <div className="bg-white/90 backdrop-blur-xl border-t border-[#0066cc]/10 z-40 shadow-lg">
                  <div className="w-full px-6 py-4">
                    <form onSubmit={handleSubmit} className="flex gap-4 items-center geometric-panel p-2">
                      <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask follow-up..."
                        className="flex-1 p-4 retro-input rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 text-base transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={!input.trim() || isSearching}
                        className="retro-button px-8 h-[50px] text-white rounded-lg font-medium text-lg flex items-center justify-center transition-all disabled:opacity-50"
                      >
                        {isSearching ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Searching</span>
                          </span>
                        ) : (
                          'Search'
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
