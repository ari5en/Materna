'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ShieldAlert, PhoneCall, AlertTriangle, ShieldCheck, Pill, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge } from '@/lib/utils';
import type { SafetyCategory } from '@/lib/ai/guardrails';
import { LotusIcon } from './LotusIcon';
import { ModalPortal } from './ModalPortal';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  safety?: SafetyCategory;
}

const MAX_INPUT_LENGTH = 500;

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-bold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

// Lightweight renderer for the assistant's replies: paragraphs, "-"/"*" bullet lists and **bold**.
function FormattedMessage({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length) {
      const items = bullets;
      bullets = [];
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1">
          {items.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>
      );
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
    } else {
      flushBullets();
      if (line) blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line)}</p>);
    }
  }
  flushBullets();

  return <div className="space-y-2">{blocks}</div>;
}

function SafetyBadge({ safety }: { safety?: SafetyCategory }) {
  if (!safety || safety === 'none') return null;

  if (safety === 'crisis') {
    return (
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9E2A3A] bg-[#FDE8EC] border border-[#F8C6CF] px-2.5 py-1 rounded-full w-fit">
        <PhoneCall className="w-3 h-3 shrink-0" />
        Immediate Crisis Support Guardrail
      </div>
    );
  }

  if (safety === 'red_flag') {
    return (
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9A4220] bg-[#FFF0E6] border border-[#F7D1B8] px-2.5 py-1 rounded-full w-fit">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        Urgent Medical Triage Alert
      </div>
    );
  }

  if (safety === 'medication') {
    return (
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6E3B75] bg-[#F5EAF4] border border-[#E4CCE2] px-2.5 py-1 rounded-full w-fit">
        <Pill className="w-3 h-3 shrink-0" />
        Clinical Dosing & Medication Guardrail
      </div>
    );
  }

  return (
    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5A3A5E] bg-[#F3EBF2] border border-[#E4D5E2] px-2.5 py-1 rounded-full w-fit">
      <ShieldCheck className="w-3 h-3 shrink-0" />
      Sanctuary Scope Guardrail
    </div>
  );
}

function SafetyActionFooter({ safety }: { safety?: SafetyCategory }) {
  if (safety === 'crisis') {
    return (
      <div className="mt-3 pt-2.5 border-t border-[#F5CBD3] flex flex-wrap gap-1.5">
        <a
          href="tel:988"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#9E2A3A] text-white hover:bg-[#82202E] transition-colors"
        >
          <PhoneCall className="w-3 h-3" />
          Call / Text 988
        </a>
        <a
          href="tel:18339435746"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white text-[#9E2A3A] border border-[#F0B4BF] hover:bg-[#FFF5F7] transition-colors"
        >
          <PhoneCall className="w-3 h-3" />
          Maternal Hotline (1-833-943-5746)
        </a>
        <a
          href="tel:911"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#2A162B] text-white hover:bg-[#3F2341] transition-colors"
        >
          Emergency 911
        </a>
      </div>
    );
  }

  if (safety === 'red_flag') {
    return (
      <div className="mt-3 pt-2.5 border-t border-[#F7D1B8] flex flex-wrap gap-1.5">
        <a
          href="tel:911"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#B84722] text-white hover:bg-[#9A3919] transition-colors"
        >
          <PhoneCall className="w-3 h-3" />
          Call 911 if Severe
        </a>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/80 text-[#8A4C32] border border-[#F7D1B8]">
          Contact OB/GYN, Midwife, or Pediatrician Triage
        </span>
      </div>
    );
  }

  return null;
}

export function AiAssistantModal() {
  const { isAiChatOpen, setIsAiChatOpen, profile, babyLogs, moodLogs, recoveryLog } = useMaterna();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${profile.full_name || 'Mama'}. Caring for ${profile.baby_name || 'Baby'} is profound, beautiful, and exhausting work. I'm right here with you — whether it's 3-AM questions on wake windows, feeding and milk supply, or needing gentle emotional reassurance. How can I help right now?`,
      timestamp: 'Just now',
      safety: 'none',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const promptScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollPrompts = (direction: 'left' | 'right') => {
    if (promptScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      promptScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isAiChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isAiChatOpen]);

  if (!isAiChatOpen) return null;

  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = babyLogs.filter((l) => l.timestamp.startsWith(todayStr));
  const feedsToday = todayLogs.filter((l) => l.log_type === 'feed').length;
  const diapersToday = todayLogs.filter((l) => l.log_type === 'diaper').length;
  const sleepHoursToday = todayLogs
    .filter((l) => l.log_type === 'sleep')
    .reduce((acc, c) => acc + (c.details.duration_mins || 0) / 60, 0);

  const samplePrompts = [
    `What are ${profile.baby_name || 'Baby'}'s wake windows at Week ${postData.weeks}?`,
    'Gentle ways to relieve newborn gas',
    'I feel overwhelmed and emotional tonight',
    'How to tell if baby is getting enough milk?',
  ];

  const handleSend = async (messageText: string) => {
    const trimmed = messageText.trim().slice(0, MAX_INPUT_LENGTH);
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.sender,
            content: m.text,
          })),
          context: {
            motherName: profile.full_name || 'Mama',
            babyName: profile.baby_name || 'Baby',
            weeksPostpartum: postData.weeks,
            wakeWindowMins: postData.recommendedWakeWindowMins,
            feedsToday,
            diapersToday,
            sleepHoursToday,
            waterGlasses: recoveryLog.water_glasses,
            latestMoodScore: moodLogs[0]?.score ?? 4,
          },
        }),
      });

      const data = await response.json().catch(() => null);
      let replyText: string;
      let replySafety: SafetyCategory = 'none';

      if (response.ok && data?.content) {
        replyText = data.content;
        replySafety = data.safety || 'none';
      } else if (response.status === 401) {
        replyText = 'Your session has expired. Please sign in again to keep chatting.';
      } else if (response.status === 504) {
        replyText = `That took longer than expected, ${profile.full_name || 'Mama'}. Please try sending it again in a moment.`;
      } else if (response.status === 429) {
        replyText = data?.error || 'You are sending messages quickly. Please wait a moment and try again.';
      } else {
        replyText = `I'm having trouble connecting right now, ${profile.full_name || 'Mama'}. Please try again in a moment. If this is urgent or medical, please contact your care provider.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          safety: replySafety,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: `I'm here with you, ${profile.full_name || 'Mama'}. Please take a gentle breath — how can I help with ${profile.baby_name || 'Baby'}'s care or your recovery?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          safety: 'none',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ModalPortal>
      <div
        onClick={() => setIsAiChatOpen(false)}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-[#F8F3F7] rounded-t-[32px] sm:rounded-[32px] max-h-[88vh] flex flex-col shadow-2xl border border-[#EFE1ED] overflow-hidden"
        >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-white/95 border-b border-[#EFE1ED] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5EAF4] text-[#7B4C7A] flex items-center justify-center shadow-xs">
              <LotusIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-serif font-bold text-sm sm:text-base text-[#2A162B]">Materna AI</span>
                <span className="text-[9px] sm:text-[10px] font-bold bg-[#F4E8F2] text-[#9E4875] px-2 py-0.5 rounded-full">
                  Wk {postData.weeks} Context
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#866B87]">Empathetic fourth-trimester care</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiChatOpen(false)}
            aria-label="Close Assistant"
            className="w-8 h-8 rounded-full bg-[#F4E8F2] hover:bg-[#EBDCE8] text-[#5A3A5E] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-[#FFF4EE] border-b border-[#FCE1D4] px-3.5 sm:px-4 py-2 flex items-start gap-2 text-[10px] sm:text-[11px] text-[#8A4C32]">
          <ShieldAlert className="w-3.5 h-3.5 text-[#C96E49] mt-0.5 shrink-0" />
          <p className="leading-tight">
            Educational support only — never medical diagnosis or dosing. For fever, heavy bleeding, or emergencies, contact your doctor or 911.
          </p>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 sm:space-y-3.5 min-h-[280px] sm:min-h-[300px]">
          {messages.map((msg) => {
            const displayText =
              msg.id === 'welcome'
                ? `Hello ${profile.full_name || 'Mama'}. Caring for ${
                    profile.baby_name || 'Baby'
                  } is profound, beautiful, and exhausting work. I'm right here with you — whether it's 3-AM questions on wake windows, feeding and milk supply, or needing gentle emotional reassurance. How can I help right now?`
                : msg.text;

            const assistantBubbleStyle =
              msg.safety === 'crisis'
                ? 'bg-[#FFF5F7] text-[#3A1219] border-2 border-[#E89AA8]'
                : msg.safety === 'red_flag'
                ? 'bg-[#FFF8F3] text-[#3B1E12] border-2 border-[#EDA882]'
                : msg.safety === 'medication'
                ? 'bg-[#FCF8FC] text-[#2C182D] border border-[#DFC5DD]'
                : 'bg-white text-[#2C182D] border border-[#EFE1ED]';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#69486F] text-white rounded-br-xs'
                      : `${assistantBubbleStyle} rounded-bl-xs`
                  }`}
                >
                  {msg.sender === 'assistant' ? (
                    <>
                      <SafetyBadge safety={msg.safety} />
                      <FormattedMessage text={displayText} />
                      <SafetyActionFooter safety={msg.safety} />
                    </>
                  ) : (
                    displayText
                  )}
                </div>
                <span className="text-[10px] text-[#A088A1] mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white border border-[#EFE1ED] rounded-2xl px-3 py-2 w-16 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9E4875] animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#9E4875] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#9E4875] animate-bounce [animation-delay:0.4s]"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts with Left & Right Arrows */}
        <div className="relative border-t border-[#EFE1ED] bg-white/80 px-2 py-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollPrompts('left')}
            aria-label="Scroll suggested questions left"
            className="w-7 h-7 rounded-full bg-[#F5EAF3] hover:bg-[#EBDCE8] text-[#69486F] flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-2xs border border-[#ECE0EB]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={promptScrollRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
          >
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-[11px] whitespace-nowrap bg-[#F5EBF3] hover:bg-[#EBDDE9] text-[#69486F] px-3.5 py-1.5 rounded-full font-semibold transition-colors shrink-0 cursor-pointer border border-[#EFE1ED]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollPrompts('right')}
            aria-label="Scroll suggested questions right"
            className="w-7 h-7 rounded-full bg-[#F5EAF3] hover:bg-[#EBDCE8] text-[#69486F] flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow-2xs border border-[#ECE0EB]"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-2.5 sm:p-3 bg-white border-t border-[#EFE1ED] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            maxLength={MAX_INPUT_LENGTH}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about wake windows, nursing, sleep, recovery..."
            className="flex-1 bg-[#FAF5FA] border border-[#ECE0EB] rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs text-[#2A162B] placeholder:text-[#A890A8] focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#9E4875] text-white flex items-center justify-center hover:bg-[#8A3B63] disabled:opacity-40 transition-all shrink-0 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  </ModalPortal>
);
}
