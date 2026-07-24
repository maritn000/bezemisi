"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useSearchParams } from "next/navigation";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";

import { exampleQuestions } from "@/lib/site-content";

function safeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function MessageContent({ message }: { message: UIMessage }) {
  const sources = message.parts.filter((part) => part.type === "source-url");

  return (
    <>
      {message.parts.map((part, index) => {
        if (part.type !== "text") return null;
        return (
          <p key={index} className="whitespace-pre-wrap">
            {part.text}
          </p>
        );
      })}
      {sources.length > 0 && (
        <div className="mt-4 border-t border-current/10 pt-3 text-sm">
          <p className="font-bold">Zdroje</p>
          <ul className="mt-1 space-y-1">
            {sources.map((source) => {
              const href = safeSourceUrl(source.url);
              if (!href) return null;
              return (
                <li key={source.sourceId}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {source.title || new URL(href).hostname}
                    <span className="sr-only"> (otevře se v novém okně)</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("q")?.slice(0, 4_000) ?? "";
  const [input, setInput] = useState(initialQuestion);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const {
    messages,
    sendMessage,
    regenerate,
    setMessages,
    status,
    error,
    clearError,
  } = useChat({ transport });

  const isBusy = status === "submitted" || status === "streaming";

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    clearError();
    await sendMessage({ text });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function clearConversation() {
    setMessages([]);
    setInput("");
    clearError();
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_70px_rgba(31,5,86,.12)] ring-1 ring-purple-950/8">
      <div className="border-b border-purple-950/10 bg-purple-950 px-5 py-5 text-white sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">AI poradce Bez emisí</p>
            <p className="mt-1 text-sm text-white/65">
              Omezený na elektromobily a služby Bez emisí
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              disabled={isBusy}
              className="min-h-11 rounded-lg border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 disabled:opacity-50"
            >
              Vymazat konverzaci
            </button>
          )}
        </div>
      </div>

      <div
        className="min-h-[25rem] space-y-5 bg-[#fbfbff] p-4 sm:min-h-[31rem] sm:p-7"
        aria-live="polite"
        aria-busy={isBusy}
      >
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl py-8 text-center">
            <div
              aria-hidden="true"
              className="mx-auto grid size-14 place-items-center rounded-full bg-green-400 text-2xl"
            >
              ↯
            </div>
            <h2 className="mt-5 text-2xl font-light text-purple-950">
              Na co se chcete zeptat?
            </h2>
            <p className="mt-2 text-purple-950/65">
              Ověřený katalog zatím není připojený. Poradce proto nebude
              odhadovat konkrétní parametry.
            </p>
            <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
              {exampleQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setInput(question)}
                  className="rounded-xl border border-purple-950/10 bg-white p-4 text-left text-sm font-medium hover:border-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-5 py-4 leading-7 sm:max-w-[75%] ${
                  message.role === "user"
                    ? "rounded-br-sm bg-blue-700 text-white"
                    : "rounded-bl-sm bg-lavender text-purple-950"
                }`}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-wider opacity-60">
                  {message.role === "user" ? "Vy" : "Bez emisí AI"}
                </p>
                <MessageContent message={message} />
              </div>
            </article>
          ))
        )}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-purple-950/65">
            <span className="size-2 animate-pulse rounded-full bg-blue-700" />
            Poradce připravuje odpověď…
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">
            <p>Odpověď se nepodařilo načíst.</p>
            <button
              type="button"
              onClick={() => {
                clearError();
                void regenerate();
              }}
              className="mt-2 font-bold underline underline-offset-2 focus-visible:outline-2"
            >
              Zkusit znovu
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="border-t border-purple-950/10 bg-white p-4 sm:p-6"
      >
        <label htmlFor="chat-message" className="sr-only">
          Zpráva pro AI poradce
        </label>
        <div className="flex items-end gap-3">
          <textarea
            id="chat-message"
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 4_000))}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={4_000}
            placeholder="Napište svou otázku…"
            disabled={isBusy}
            className="min-h-14 flex-1 resize-none rounded-xl border border-purple-950/20 px-4 py-3 text-base text-purple-950 outline-none placeholder:text-purple-950/40 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:bg-purple-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isBusy}
            className="button button-blue min-w-24 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Odeslat
          </button>
        </div>
        <p className="mt-2 text-xs text-purple-950/50">
          Enter odešle zprávu, Shift+Enter vloží nový řádek.
        </p>
      </form>
    </div>
  );
}
