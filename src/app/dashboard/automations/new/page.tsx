"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAutomationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    ig_account_id: "",
    name: "",
    trigger_type: "comment_keyword",
    trigger_value: "",
    reply_template: "Oi {{username}}! Aqui está o link que você pediu: ",
    ai_qualify: false,
    qualification_prompt: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      setError(JSON.stringify(body.error));
      return;
    }
    router.push("/dashboard/automations");
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Nova automação</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nome da automação
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border border-line bg-white px-3 py-2"
            placeholder="Ex: Link do curso via comentário"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          ID da conta Instagram conectada
          <input
            required
            value={form.ig_account_id}
            onChange={(e) => setForm({ ...form, ig_account_id: e.target.value })}
            className="rounded-md border border-line bg-white px-3 py-2"
            placeholder="uuid da ig_accounts (veja em Conexão Instagram)"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Gatilho
          <select
            value={form.trigger_type}
            onChange={(e) => setForm({ ...form, trigger_type: e.target.value })}
            className="rounded-md border border-line bg-white px-3 py-2"
          >
            <option value="comment_keyword">Palavra-chave no comentário</option>
            <option value="dm_keyword">Palavra-chave na DM</option>
            <option value="new_dm">Toda nova DM</option>
            <option value="story_reply">Resposta a story</option>
          </select>
        </label>

        {form.trigger_type !== "new_dm" && (
          <label className="flex flex-col gap-1 text-sm">
            Palavra-chave
            <input
              value={form.trigger_value}
              onChange={(e) => setForm({ ...form, trigger_value: e.target.value })}
              className="rounded-md border border-line bg-white px-3 py-2"
              placeholder="ex: link"
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Mensagem de resposta (use {"{{username}}"} para personalizar)
          <textarea
            required
            rows={3}
            value={form.reply_template}
            onChange={(e) => setForm({ ...form, reply_template: e.target.value })}
            className="rounded-md border border-line bg-white px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.ai_qualify}
            onChange={(e) => setForm({ ...form, ai_qualify: e.target.checked })}
          />
          Deixar a IA qualificar esse lead após responder
        </label>

        {form.ai_qualify && (
          <label className="flex flex-col gap-1 text-sm">
            Critério de qualificação (opcional)
            <textarea
              rows={2}
              value={form.qualification_prompt}
              onChange={(e) => setForm({ ...form, qualification_prompt: e.target.value })}
              className="rounded-md border border-line bg-white px-3 py-2"
              placeholder="ex: só considere qualificado quem mencionar orçamento ou urgência"
            />
          </label>
        )}

        {error && <p className="text-sm text-alert">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-md bg-ink px-4 py-3 text-paper transition hover:bg-signal disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Criar automação"}
        </button>
      </form>
    </div>
  );
}
