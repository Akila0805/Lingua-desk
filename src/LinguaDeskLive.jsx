import { useEffect, useRef, useState } from 'react';

/* ============================= CONFIG ============================= */

const PRIORITIES = {
  critical: { label: 'Critical', minutes: 30, weight: 4, cls: 'p-critical' },
  high: { label: 'High', minutes: 45, weight: 3, cls: 'p-high' },
  medium: { label: 'Medium', minutes: 240, weight: 2, cls: 'p-medium' },
  low: { label: 'Low', minutes: 720, weight: 1, cls: 'p-low' },
};

const LANGUAGES = [
  'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi',
  'Gujarati', 'Punjabi', 'Urdu', 'Spanish', 'French', 'German', 'Portuguese',
  'Arabic', 'Chinese (Simplified)', 'Japanese', 'Russian', 'Korean',
];

const SAMPLE_QUERIES = {
  Hindi: { subject: 'भुगतान असफल हो गया', body: 'मैंने कल अपना मासिक सदस्यता शुल्क चुकाने की कोशिश की, लेकिन पैसा कट गया और खाता अपग्रेड नहीं हुआ। कृपया जल्दी मदद करें।' },
  Tamil: { subject: 'கணக்கு பூட்டப்பட்டுள்ளது', body: 'நான் மூன்று முறை தவறான கடவுச்சொல்லை உள்ளிட்டதால் எனது கணக்கு பூட்டப்பட்டுள்ளது. தயவுசெய்து விரைவாக திறக்க உதவுங்கள்.' },
  Telugu: { subject: 'రిఫండ్ ఇంకా రాలేదు', body: 'నేను పది రోజుల క్రితం ఆర్డర్ రద్దు చేసాను, కానీ ఇంకా రిఫండ్ నా ఖాతాలో జమ కాలేదు.' },
  Kannada: { subject: 'ಆ್ಯಪ್ ಪದೇ ಪದೇ ಕ್ರ್ಯಾಶ್ ಆಗುತ್ತಿದೆ', body: 'ನಾನು ಲಾಗಿನ್ ಮಾಡಿದ ತಕ್ಷಣ ಆ್ಯಪ್ ಕ್ರ್ಯಾಶ್ ಆಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಪರಿಹಾರ ತಿಳಿಸಿ.' },
  Malayalam: { subject: 'ഇൻവോയ്സ് തെറ്റാണ്', body: 'എനിക്ക് ലഭിച്ച ഇൻവോയ്സിൽ ഇരട്ടി തുക കാണിക്കുന്നു. ദയവായി ഇത് പരിശോധിക്കുക.' },
  Bengali: { subject: 'ডেলিভারি দেরি হচ্ছে', body: 'আমার অর্ডারটি পাঁচ দিন আগে পাঠানোর কথা ছিল, কিন্তু এখনও পৌঁছায়নি।' },
  Marathi: { subject: 'सदस्यता रद्द करायची आहे', body: 'मला माझी वार्षिक सदस्यता रद्द करायची आहे आणि उर्वरित रक्कम परत हवी आहे.' },
  Gujarati: { subject: 'લોગિન થઈ શકતું નથી', body: 'હું મારા ખાતામાં લોગિન કરવાનો પ્રયાસ કરું છું પણ ભૂલ આવે છે. મદદ કરો.' },
  Punjabi: { subject: 'ਭੁਗਤਾਨ ਦੋ ਵਾਰ ਕੱਟਿਆ ਗਿਆ', body: 'ਮੇਰੇ ਖਾਤੇ ਵਿੱਚੋਂ ਇੱਕੋ ਆਰਡਰ ਲਈ ਦੋ ਵਾਰ ਪੈਸੇ ਕੱਟੇ ਗਏ ਹਨ।' },
  Urdu: { subject: 'اکاؤنٹ معطل ہو گیا', body: 'میرا اکاؤنٹ بغیر کسی وجہ کے معطل کر دیا گیا ہے۔ برائے مہربانی جلد بحال کریں۔' },
  Spanish: { subject: 'No puedo restablecer mi contraseña', body: 'Llevo dos días intentando restablecer mi contraseña pero el correo nunca llega.' },
  French: { subject: 'Facture incorrecte reçue', body: "J'ai reçu une facture avec un montant deux fois plus élevé que prévu." },
  German: { subject: 'Bestellung nicht angekommen', body: 'Meine Bestellung sollte vor vier Tagen geliefert werden, ist aber immer noch nicht angekommen.' },
  Portuguese: { subject: 'Reembolso não recebido', body: 'Cancelei meu pedido há uma semana, mas o reembolso ainda não apareceu na minha conta.' },
  Arabic: { subject: 'تعطل التطبيق باستمرار', body: 'التطبيق يتوقف عن العمل فور تسجيل الدخول منذ آخر تحديث.' },
  'Chinese (Simplified)': { subject: '退款尚未到账', body: '我十天前取消了订单，但退款至今仍未到账。请尽快核实。' },
  Japanese: { subject: 'アカウントにログインできません', body: '正しいパスワードを入力しているのにエラーが出てログインできません。' },
  Russian: { subject: 'Заказ не пришёл вовремя', body: 'Мой заказ должен был прийти три дня назад, но до сих пор не доставлен.' },
  Korean: { subject: '결제가 중복으로 청구되었습니다', body: '같은 주문에 대해 결제가 두 번 청구되었습니다.' },
};

const EVENT_LABELS = {
  created: 'Ticket submitted',
  translated: 'Translated to English',
  translation_retry: 'Translation attempt failed — retrying quietly',
  claimed: 'Claimed',
  resolved: 'Resolved',
  escalated: 'Escalated — SLA at risk',
};

/* ============================= HELPERS ============================= */

function makeId() {
  return 'TCK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function slaLabel(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatDuration(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h <= 0 ? `${m}m` : `${h}h ${String(m).padStart(2, '0')}m`;
}

function slaState(t) {
  if (t.status === 'resolved') return 'done';
  const remaining = t.slaDeadline - Date.now();
  const total = t.slaDeadline - t.createdAt;
  if (remaining <= 0) return 'danger';
  if (remaining / total < 0.35) return 'warn';
  return 'safe';
}

function formatCountdown(t) {
  if (t.status === 'resolved') return `Resolved in ${formatDuration(t.resolvedAt - t.createdAt)}`;
  const remaining = t.slaDeadline - Date.now();
  if (remaining <= 0) return `BREACHED · ${formatDuration(-remaining)} over`;
  return `${formatDuration(remaining)} left`;
}

function withEvent(ticket, type, detail, actor) {
  return {
    ...ticket,
    events: [...(ticket.events || []), { type, detail: detail || null, actor: actor || 'system', at: Date.now() }],
  };
}

async function callClaude(systemPrompt, userText) {

  const langMap = {
    English: "en",
    Hindi: "hi",
    Tamil: "ta",
    Telugu: "te",
    Kannada: "kn",
    Malayalam: "ml",
    Bengali: "bn",
    Marathi: "mr",
    Gujarati: "gu",
    Punjabi: "pa",
    Urdu: "ur",
    Spanish: "es",
    French: "fr",
    German: "de",
    Portuguese: "pt",
    Arabic: "ar",
    Chinese: "zh",
    Japanese: "ja",
    Russian: "ru",
    Korean: "ko"
  };

  const target =
    Object.keys(langMap).find(key =>
      systemPrompt.includes(`to ${key}`)
    ) || "English";

  try {

    const response = await fetch(
      "https://translate.argosopentech.com/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q: userText,
          source: "auto",
          target: langMap[target],
          format: "text"
        })
      }
    );

    const data = await response.json();

    return data.translatedText;

  } catch (e) {

    console.error(e);

    throw new Error("Translation service unavailable.");

  }

}
  function updateTickets(updater) {
    const next = typeof updater === 'function' ? updater(ticketsRef.current) : updater;
    applyTickets(next);
  }

  function buildSeedTickets() {
    const now = Date.now();
    const defs = [
      { name: 'Ananya Rao', lang: 'Hindi', priority: 'critical', ageMs: 0.45 * 3600 * 1000 },
      { name: 'Karthik Subramaniam', lang: 'Tamil', priority: 'high', ageMs: 0.6 * 3600 * 1000 },
      { name: 'Wei Chen', lang: 'Chinese (Simplified)', priority: 'medium', ageMs: 1 * 3600 * 1000 },
      { name: 'Lucia Fernandez', lang: 'Spanish', priority: 'low', ageMs: 2 * 3600 * 1000 },
      { name: 'Fatima Al-Sayed', lang: 'Arabic', priority: 'high', ageMs: 0.1 * 3600 * 1000 },
      { name: 'Priya Nair', lang: 'Malayalam', priority: 'medium', ageMs: 4.5 * 3600 * 1000 },
    ];
    return defs.map((d) => {
      const sample = SAMPLE_QUERIES[d.lang];
      const createdAt = now - d.ageMs;
      let t = {
        id: makeId(), customerName: d.name, customerEmail: `${d.name.split(' ')[0].toLowerCase()}@example.com`,
        language: d.lang, priority: d.priority, subjectOriginal: sample.subject, queryOriginal: sample.body,
        subjectEN: null, queryEN: null, status: 'translating', assignedEngineerName: null, escalated: false,
        createdAt, slaDeadline: createdAt + PRIORITIES[d.priority].minutes * 60000, resolvedAt: null,
        replyEN: null, replyOriginal: null, updatedAt: createdAt, events: [],
      };
      t = withEvent(t, 'created', `${d.priority} priority, ${d.lang}`, 'customer');
      return t;
    });
  }

  // ---- initial load + shared-storage sync ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      let remote = null;
      try {
        const res = await fetch('/api/tickets');
        remote = res.ok ? await res.json() : null;
      } catch {}
      if (!mounted) return;
      if (remote && remote.length) {
        ticketsRef.current = remote;
        setTickets(remote);
        remote.filter((t) => t.status === 'translating').forEach((t) => translateIncoming(t.id));
      } else {
        const seeded = buildSeedTickets();
        applyTickets(seeded);
        seeded.forEach((t) => translateIncoming(t.id));
      }
    })();

    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/tickets');
        const remote = res.ok ? await res.json() : [];
        const prev = ticketsRef.current;
        const localById = new Map(prev.map((t) => [t.id, t]));
        const remoteById = new Map(remote.map((t) => [t.id, t]));
        const ids = new Set([...localById.keys(), ...remoteById.keys()]);
        let changed = false;
        const merged = [];
        ids.forEach((id) => {
          const l = localById.get(id), r = remoteById.get(id);
          if (l && r) { if ((r.updatedAt || 0) > (l.updatedAt || 0)) { merged.push(r); changed = true; } else merged.push(l); }
          else if (r) { merged.push(r); changed = true; }
          else merged.push(l);
        });
        if (changed) {
          merged.sort((a, b) => b.createdAt - a.createdAt);
          ticketsRef.current = merged;
          setTickets(merged);
        }
      } catch {}
    }, 4000);

    return () => { mounted = false; clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- escalation sweep (client-side) ----
  useEffect(() => {
    const sweep = setInterval(() => {
      updateTickets((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.escalated || t.status === 'resolved') return t;
          const remaining = t.slaDeadline - Date.now();
          const total = t.slaDeadline - t.createdAt;
          if (remaining / total < 0.15) {
            changed = true;
            return withEvent({ ...t, escalated: true, updatedAt: Date.now() }, 'escalated', 'Less than 15% of SLA window remaining', 'system');
          }
          return t;
        });
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(sweep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- translation (silent retry, never surfaced as failed) ----
  async function translateIncoming(ticketId, attempt = 1) {
    const BACKGROUND_MAX_ATTEMPTS = 15;
    const current = ticketsRef.current.find((t) => t.id === ticketId);
    if (!current || current.status !== 'translating') return;

    try {
      const { subject, body } = await translatePair(current.subjectOriginal, current.queryOriginal, current.language, 'English');
      updateTickets((prev) => prev.map((t) => t.id === ticketId
        ? withEvent({ ...t, subjectEN: subject, queryEN: body, status: 'open', updatedAt: Date.now() }, 'translated', null, 'system')
        : t));
      return;
    } catch (err) {
      if (attempt === 1) {
        updateTickets((prev) => prev.map((t) => t.id === ticketId
          ? withEvent({ ...t, updatedAt: Date.now() }, 'translation_retry', err.message, 'system')
          : t));
      }
      if (attempt < BACKGROUND_MAX_ATTEMPTS) {
        const delay = Math.min(15000, 800 * attempt);
        setTimeout(() => translateIncoming(ticketId, attempt + 1), delay);
      }
    }
  }

  // ---- customer: submit ----
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.body.trim()) {
      showToast('Please fill in your name, email, subject, and query.', 'error');
      return;
    }
    const createdAt = Date.now();
    let ticket = {
      id: makeId(), customerName: form.name.trim(), customerEmail: form.email.trim(),
      language: form.language, priority: form.priority, subjectOriginal: form.subject.trim(), queryOriginal: form.body.trim(),
      subjectEN: null, queryEN: null, status: 'translating', assignedEngineerName: null, escalated: false,
      createdAt, slaDeadline: createdAt + PRIORITIES[form.priority].minutes * 60000, resolvedAt: null,
      replyEN: null, replyOriginal: null, updatedAt: createdAt, events: [],
    };
    ticket = withEvent(ticket, 'created', `${form.priority} priority, ${form.language}`, 'customer');
    updateTickets((prev) => [ticket, ...prev]);
    setForm((f) => ({ ...f, subject: '', body: '' }));
    setConfirmTicket(ticket);
    setTimeout(() => setConfirmTicket((c) => (c && c.id === ticket.id ? null : c)), 5000);
    translateIncoming(ticket.id);
  }

  function useSample() {
    const s = SAMPLE_QUERIES[form.language];
    if (s) setForm((f) => ({ ...f, subject: s.subject, body: s.body }));
  }

  // ---- engineer: claim / reply ----
  function claimTicket(id) {
    updateTickets((prev) => prev.map((t) => t.id === id
      ? withEvent({ ...t, assignedEngineerName: CURRENT_ENGINEER.displayName, updatedAt: Date.now() }, 'claimed', null, CURRENT_ENGINEER.displayName)
      : t));
  }

  async function sendReply(id, replyText, btnRef) {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket || !replyText.trim()) return;
    if (btnRef) btnRef.disabled = true;
    try {
      const translated = await translateText(replyText, 'English', ticket.language);
      updateTickets((prev) => prev.map((t) => {
        if (t.id !== id) return t;
        let updated = { ...t, replyEN: replyText, replyOriginal: translated, status: 'resolved', resolvedAt: Date.now(), updatedAt: Date.now() };
        if (!updated.assignedEngineerName) {
          updated.assignedEngineerName = CURRENT_ENGINEER.displayName;
          updated = withEvent(updated, 'claimed', 'Auto-assigned on reply', CURRENT_ENGINEER.displayName);
        }
        return withEvent(updated, 'resolved', null, CURRENT_ENGINEER.displayName);
      }));
      showToast(`Reply sent to ${ticket.customerName} in ${ticket.language}.`, 'success');
    } catch (err) {
      showToast('Could not translate the reply. Please try again.', 'error');
    } finally {
      if (btnRef) btnRef.disabled = false;
    }
  }

  /* ============================= DERIVED DATA ============================= */

  const emailKey = form.email.trim().toLowerCase();
  const myTickets = tickets.filter((t) => t.customerEmail.toLowerCase() === emailKey);

  let engineerVisible = [...tickets];
  if (filterStatus === 'open') engineerVisible = engineerVisible.filter((t) => t.status === 'open' || t.status === 'translating');
  if (filterStatus === 'resolved') engineerVisible = engineerVisible.filter((t) => t.status === 'resolved');
  if (filterPriority !== 'all') engineerVisible = engineerVisible.filter((t) => t.priority === filterPriority);
  engineerVisible.sort((a, b) => {
    if (a.escalated !== b.escalated) return a.escalated ? -1 : 1;
    const pw = PRIORITIES[b.priority].weight - PRIORITIES[a.priority].weight;
    if (pw !== 0) return pw;
    return a.slaDeadline - b.slaDeadline;
  });
  const selectedTicket = tickets.find((t) => t.id === selectedId) || null;

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'translating').length;
  const breachingCount = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'translating' && slaState(t) !== 'safe').length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const resolvedToday = tickets.filter((t) => t.status === 'resolved' && t.resolvedAt >= today.getTime());
  const avgMs = resolvedToday.length ? resolvedToday.reduce((s, t) => s + (t.resolvedAt - t.createdAt), 0) / resolvedToday.length : 0;

  const resolvedAll = tickets.filter((t) => t.status === 'resolved');
  const resolvedWithinSla = resolvedAll.filter((t) => t.resolvedAt <= t.slaDeadline);
  const slaComplianceRate = resolvedAll.length ? resolvedWithinSla.length / resolvedAll.length : null;
  const byPriorityStats = Object.keys(PRIORITIES).map((key) => {
    const inPriority = tickets.filter((t) => t.priority === key);
    const resolved = inPriority.filter((t) => t.status === 'resolved');
    const withinSla = resolved.filter((t) => t.resolvedAt <= t.slaDeadline);
    const avg = resolved.length ? resolved.reduce((s, t) => s + (t.resolvedAt - t.createdAt), 0) / resolved.length : null;
    return { key, total: inPriority.length, resolved: resolved.length, compliance: resolved.length ? withinSla.length / resolved.length : null, avg };
  });
  const byLanguage = {};
  tickets.forEach((t) => { byLanguage[t.language] = (byLanguage[t.language] || 0) + 1; });
  const byLanguageSorted = Object.entries(byLanguage).sort((a, b) => b[1] - a[1]).slice(0, 10);

  /* ============================= RENDER ============================= */

  return (
    <div className="ld-root">
      <style>{CSS}</style>

      <header>
        <div className="brand">
          <div className="brand-mark">LD</div>
          <div className="brand-text">
            <h1>LinguaDesk</h1>
            <p>QUERY CLEARANCE · SLA · PRIORITY ROUTING</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="role-switch">
            <button className={role === 'customer' ? 'active' : ''} onClick={() => setRole('customer')}>Customer view</button>
            <button className={role === 'engineer' ? 'active' : ''} onClick={() => setRole('engineer')}>Engineer view</button>
          </div>
        </div>
      </header>

      <main>
        {role === 'customer' ? (
          <div className="split">
            <div className="panel">
              <div className="panel-head"><div><h2>Submit a query</h2><div className="sub">Write in your own language</div></div></div>
              <div className="panel-body">
                <form onSubmit={handleSubmit}>
                  <div className="field"><label>Your name</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ananya Rao" />
                  </div>
                  <div className="field"><label>Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
                  </div>
                  <div className="row2">
                    <div className="field"><label>Language</label>
                      <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Priority</label>
                      <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                        {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label} · SLA {slaLabel(p.minutes)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="field"><label>Subject</label>
                    <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Short summary" />
                  </div>
                  <div className="field"><label>Describe your issue</label>
                    <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Explain what's happening…" />
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={useSample}>Use a sample query in this language</button>
                  <button type="submit" className="btn btn-primary btn-block">Submit query</button>
                </form>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><div><h2>My tickets</h2><div className="sub">{myTickets.length} ticket{myTickets.length === 1 ? '' : 's'} on file</div></div></div>
              <div className="panel-body" style={{ maxHeight: 640, overflowY: 'auto' }}>
                {!emailKey && <p className="empty-note">Enter your email above to see your ticket history.</p>}
                {emailKey && myTickets.length === 0 && <p className="empty-note">No tickets yet for this email.</p>}
                {myTickets.map((t) => (
                  <div className="my-ticket" key={t.id}>
                    <div className="top-line"><span className="ticket-id">{t.id}</span><StatusBadge status={t.status} /></div>
                    <div className="ticket-subject">{t.subjectOriginal}</div>
                    <div className="ticket-meta" style={{ marginTop: 8 }}>
                      <PriorityBadge priority={t.priority} /><LanguageBadge language={t.language} /><Countdown ticket={t} />
                    </div>
                    {t.status === 'resolved' && (
                      <div className="translated-reply">
                        <div className="qa-label">Engineer's reply (translated to {t.language})</div>
                        <div className="qa-text">{t.replyOriginal}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="stats">
              <div className="stat accent"><div className="label">Open tickets</div><div className="value">{openCount}</div></div>
              <div className="stat danger"><div className="label">At risk / breaching SLA</div><div className="value">{breachingCount}</div></div>
              <div className="stat safe"><div className="label">Resolved today</div><div className="value">{resolvedToday.length}</div></div>
              <div className="stat"><div className="label">Avg resolution time</div><div className="value">{avgMs ? formatDuration(avgMs) : '—'}</div></div>
            </div>

            <div className="role-switch" style={{ display: 'inline-flex', marginBottom: 20 }}>
              <button className={tab === 'queue' ? 'active' : ''} onClick={() => setTab('queue')}>Queue</button>
              <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Reports</button>
            </div>

            {tab === 'reports' ? (
              <div className="panel">
                <div className="panel-body">
                  <div className="stats" style={{ marginBottom: 20 }}>
                    <div className="stat accent"><div className="label">Total tickets</div><div className="value">{tickets.length}</div></div>
                    <div className="stat safe"><div className="label">Resolved</div><div className="value">{resolvedAll.length}</div></div>
                    <div className="stat danger"><div className="label">Escalated (active)</div><div className="value">{tickets.filter((t) => t.escalated && t.status !== 'resolved').length}</div></div>
                    <div className="stat"><div className="label">SLA compliance</div><div className="value">{slaComplianceRate == null ? '—' : `${Math.round(slaComplianceRate * 100)}%`}</div></div>
                  </div>
                  <div className="section-label">By priority</div>
                  <table className="report-table">
                    <thead><tr><th>Priority</th><th>Total</th><th>Resolved</th><th>SLA compliance</th><th>Avg resolution</th></tr></thead>
                    <tbody>
                      {byPriorityStats.map((r) => (
                        <tr key={r.key}>
                          <td><PriorityBadge priority={r.key} /></td>
                          <td className="mono">{r.total}</td>
                          <td className="mono">{r.resolved}</td>
                          <td className="mono">{r.compliance == null ? '—' : `${Math.round(r.compliance * 100)}%`}</td>
                          <td className="mono">{r.avg == null ? '—' : formatDuration(r.avg)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="section-label" style={{ marginTop: 20 }}>Top languages</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {byLanguageSorted.map(([lang, count]) => <span key={lang} className="badge badge-lang">{lang} · {count}</span>)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="split">
                <div className="panel">
                  <div className="panel-head"><div><h2>Priority queue</h2><div className="sub">Escalated first, then priority, then SLA urgency</div></div></div>
                  <div className="filter-row">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="open">Open</option><option value="resolved">Resolved</option><option value="all">All</option>
                    </select>
                    <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                      <option value="all">All priorities</option>
                      {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="queue-list">
                    {engineerVisible.length === 0 && <div className="queue-empty">No tickets match this filter.</div>}
                    {engineerVisible.map((t) => (
                      <div key={t.id} className={`ticket-row ${t.id === selectedId ? 'selected' : ''}`} onClick={() => setSelectedId(t.id)}>
                        <div className="top-line"><span className="ticket-id">{t.id}</span><Countdown ticket={t} /></div>
                        <div className="ticket-subject">{t.subjectEN || t.subjectOriginal}</div>
                        <div className="ticket-meta">
                          {t.escalated && t.status !== 'resolved' && <EscalatedBadge />}
                          <PriorityBadge priority={t.priority} /><LanguageBadge language={t.language} direction="EN" /><StatusBadge status={t.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <TicketDetail
                    ticket={selectedTicket}
                    engineer={CURRENT_ENGINEER}
                    onClaim={claimTicket}
                    onReply={sendReply}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {confirmTicket && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <div className="confirm-check">✓</div>
            <h3>Query submitted</h3>
            <p>Ticket <strong>{confirmTicket.id}</strong> has been sent to the engineering queue.</p>
            <div className="ticket-meta" style={{ justifyContent: 'center', marginTop: 10 }}>
              <PriorityBadge priority={confirmTicket.priority} /><LanguageBadge language={confirmTicket.language} />
            </div>
            <p className="settings-note" style={{ marginTop: 10 }}>
              Expected response within {slaLabel(PRIORITIES[confirmTicket.priority].minutes)} (SLA).
            </p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setConfirmTicket(null)}>Got it</button>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.kind}`}>{toast.msg}</div>}

    </div>
  );
}

/* ============================= TICKET DETAIL ============================= */

function TicketDetail({ ticket, engineer, onClaim, onReply }) {
  const [reply, setReply] = useState('');
  const btnRef = useRef(null);

  useEffect(() => { setReply(''); }, [ticket?.id]);

  if (!ticket) {
    return <div className="detail-empty"><div className="icon">✉</div><p>Select a ticket from the queue to read the translated query and reply in English.</p></div>;
  }

  const translating = ticket.status === 'translating';
  const isMine = ticket.assignedEngineerName === engineer.displayName;

  return (
    <>
      <div className="detail-header">
        <div className="title-row">
          <h3>{ticket.subjectEN || ticket.subjectOriginal}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {ticket.escalated && ticket.status !== 'resolved' && <EscalatedBadge />}
            <Countdown ticket={ticket} />
          </div>
        </div>
        <div className="customer-line">
          {ticket.id} · {ticket.customerName} · <span className="bridge-chip">{ticket.language} <span className="arrow">→</span> English</span>
        </div>
        <div className="ticket-meta" style={{ marginTop: 10 }}>
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          {ticket.assignedEngineerName ? (
            <span className="badge badge-status">{isMine ? 'Claimed by you' : `Claimed by ${ticket.assignedEngineerName}`}</span>
          ) : ticket.status !== 'resolved' ? (
            <button className="btn btn-ghost btn-xs" onClick={() => onClaim(ticket.id)}>Claim this ticket</button>
          ) : null}
        </div>
      </div>
      <div className="panel-body">
        <div className="qa-block original">
          <div className="qa-label">Original message ({ticket.language})</div>
          <div className="qa-text">{ticket.queryOriginal}</div>
        </div>

        {translating ? (
          <div className="qa-block english" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="loader" /><div className="qa-text" style={{ color: 'var(--text-faint)' }}>Translating to English…</div>
          </div>
        ) : (
          <div className="qa-block english">
            <div className="qa-label">Translated to English</div>
            <div className="qa-text">{ticket.queryEN}</div>
          </div>
        )}

        {ticket.status === 'resolved' && (
          <>
            <div className="qa-block neutral">
              <div className="qa-label">Reply (English)</div>
              <div className="qa-text">{ticket.replyEN}</div>
            </div>
            <div className="translated-reply">
              <div className="qa-label">Sent to customer in {ticket.language}</div>
              <div className="qa-text">{ticket.replyOriginal}</div>
            </div>
          </>
        )}

        {ticket.status === 'open' && (
          <div className="reply-box">
            <label>Reply in English</label>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Type your response — it will be translated into ${ticket.language} automatically…`} />
            <button ref={btnRef} className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={() => onReply(ticket.id, reply, btnRef.current)}>
              Send reply — translate to {ticket.language}
            </button>
          </div>
        )}

        {ticket.events && ticket.events.length > 0 && (
          <div className="qa-block neutral" style={{ marginTop: 16 }}>
            <div className="qa-label">Audit trail</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {ticket.events.map((e, i) => (
                <div key={i} className="event-row">
                  <span className="event-time">{new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span>{EVENT_LABELS[e.type] || e.type}{e.actor && e.actor !== 'system' ? ` — ${e.actor}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ============================= STYLES ============================= */

const CSS = `
.ld-root{
  --bg:#FFFFFF; --surface:#FFFFFF; --surface-2:#F3F5FC; --surface-3:#E9EDFB; --border:#E2E6F5;
  --text:#181B32; --text-dim:#5B6180; --text-faint:#9AA0C0; --accent:#FF6F3C; --bridge:#3B6BFF;
  --safe:#12C48B; --warn:#FFB020; --danger:#FF4D67;
  font-family:'Inter',system-ui,sans-serif; color:var(--text);
  background:
    radial-gradient(900px 420px at 90% -15%, rgba(255,111,60,0.10), transparent),
    radial-gradient(800px 420px at -10% 115%, rgba(59,107,255,0.10), transparent),
    var(--bg);
  border-radius:0; min-height:100vh;
}
.ld-root *{box-sizing:border-box;}
.ld-root button{font-family:inherit;cursor:pointer;}
.ld-root input,.ld-root select,.ld-root textarea{font-family:inherit;}
header{border-bottom:1px solid var(--border);padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;background:rgba(255,255,255,0.92);}
.brand{display:flex;align-items:center;gap:12px;}
.brand-mark{width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#FF6F3C,#FFB020);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px;flex-shrink:0;box-shadow:0 4px 10px rgba(255,111,60,0.35);}
.brand-text h1{font-size:17px;font-weight:700;}
.brand-text p{font-size:10.5px;color:var(--text-dim);font-family:monospace;letter-spacing:0.3px;margin-top:1px;}
.role-switch{display:flex;background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:3px;gap:2px;}
.role-switch button{border:none;background:transparent;color:var(--text-dim);padding:7px 16px;border-radius:999px;font-size:12.5px;font-weight:600;}
.role-switch button.active{background:var(--accent);color:#fff;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:18px;}
.stat{background:#fff;padding:14px 18px;}
.stat .label{font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-faint);font-weight:600;}
.stat .value{font-family:monospace;font-size:23px;font-weight:700;margin-top:4px;}
.stat.danger .value{color:var(--danger);} .stat.safe .value{color:var(--safe);} .stat.accent .value{color:var(--accent);}
main{padding:20px;}
.settings-note{font-size:11.5px;color:var(--text-dim);line-height:1.5;margin-bottom:10px;}
.split{display:grid;grid-template-columns:360px 1fr;gap:16px;align-items:start;}
.panel{background:#fff;border:1px solid var(--border);border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(24,27,50,0.05);}
.panel-head{padding:14px 16px;border-bottom:1px solid var(--border);}
.panel-head h2{font-size:13.5px;font-weight:700;}
.panel-head .sub{font-size:10.5px;color:var(--text-faint);font-family:monospace;margin-top:2px;}
.panel-body{padding:16px;}
label{display:block;font-size:11px;font-weight:600;color:var(--text-dim);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;}
.field{margin-bottom:12px;}
input,select,textarea{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);padding:9px 11px;border-radius:7px;font-size:13px;}
textarea{resize:vertical;min-height:80px;line-height:1.5;}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(255,111,60,0.15);}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:7px;border:none;font-size:13px;font-weight:700;}
.btn-primary{background:linear-gradient(135deg,#FF6F3C,#FF8F5C);color:#fff;box-shadow:0 3px 8px rgba(255,111,60,0.3);}
.btn-ghost{background:var(--surface-3);color:var(--text);border:1px solid var(--border);}
.btn-block{width:100%;}
.btn-sm{font-size:12px;padding:7px 12px;}
.btn-xs{font-size:11px;padding:4px 10px;}
.form-error{color:var(--danger);font-size:12px;margin-bottom:10px;}
.badge{display:inline-flex;align-items:center;gap:5px;font-family:monospace;font-size:10px;font-weight:700;letter-spacing:0.2px;padding:4px 8px;border-radius:6px;text-transform:uppercase;}
.badge-lang{background:#3B6BFF;color:#fff;}
.p-critical{background:#FF4D67;color:#fff;}
.p-high{background:#FF6F3C;color:#fff;}
.p-medium{background:#FFB020;color:#3A2600;}
.p-low{background:#12C48B;color:#fff;}
.badge-status{background:var(--surface-3);color:var(--text-dim);border:1px solid var(--border);}
.badge-resolved{background:#E6FBF3;color:#0B9268;border:1px solid #B7F0DC;}
.badge-escalated{background:#FF4D67;color:#fff;animation:ldpulse 1.6s infinite;}
.bridge-chip{display:inline-flex;align-items:center;gap:5px;font-family:monospace;font-size:10px;color:var(--text-dim);}
.bridge-chip .arrow{color:var(--bridge);font-weight:700;}
.queue-list{max-height:560px;overflow-y:auto;}
.queue-empty{padding:36px 16px;text-align:center;color:var(--text-faint);font-size:12.5px;}
.ticket-row{padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;flex-direction:column;gap:7px;}
.ticket-row:hover{background:var(--surface-2);}
.ticket-row.selected{background:#FFF1EB;border-left:3px solid var(--accent);padding-left:13px;}
.ticket-row .top-line{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ticket-id{font-family:monospace;font-size:10.5px;color:var(--text-faint);}
.ticket-subject{font-size:12.5px;font-weight:600;}
.ticket-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.countdown{font-family:monospace;font-size:11px;font-weight:700;padding:4px 9px;border-radius:6px;display:inline-flex;align-items:center;gap:5px;}
.countdown::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;}
.countdown.c-safe{background:#E6FBF3;color:#0B9268;}
.countdown.c-warn{background:#FFF4DE;color:#B5750E;}
.countdown.c-danger{background:#FFE8EC;color:#E11D48;animation:ldpulse 1.6s infinite;}
.countdown.c-done{background:var(--surface-3);color:var(--text-faint);}
@keyframes ldpulse{0%,100%{opacity:1;}50%{opacity:0.55;}}
.detail-empty{padding:60px 20px;text-align:center;color:var(--text-faint);}
.detail-empty .icon{font-size:30px;margin-bottom:8px;opacity:0.5;}
.detail-empty p{font-size:13px;max-width:280px;margin:0 auto;}
.qa-block{background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:10px;}
.qa-block .qa-label{font-size:10px;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-faint);font-weight:700;margin-bottom:6px;}
.qa-block .qa-text{font-size:13px;line-height:1.55;white-space:pre-wrap;}
.qa-block.original{border-left:3px solid var(--bridge);}
.qa-block.english{border-left:3px solid var(--accent);}
.qa-block.neutral{border-left:3px solid var(--surface-3);}
.detail-header{padding:16px;border-bottom:1px solid var(--border);}
.detail-header .title-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px;}
.detail-header h3{font-size:15px;font-weight:700;}
.customer-line{font-size:11.5px;color:var(--text-dim);font-family:monospace;}
.reply-box{margin-top:14px;}
.translated-reply{background:#E6FBF3;border:1px solid #B7F0DC;border-radius:8px;padding:12px 14px;margin-top:8px;}
.translated-reply .qa-label{color:#0B9268;}
.loader{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid rgba(24,27,50,0.15);border-top-color:var(--accent);animation:ldspin .7s linear infinite;}
@keyframes ldspin{to{transform:rotate(360deg);}}
.filter-row{display:flex;gap:8px;padding:10px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap;}
.filter-row select{width:auto;font-size:11.5px;padding:6px 9px;}
.my-ticket{padding:11px 13px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;margin-bottom:9px;}
.my-ticket .top-line{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.empty-note{font-size:12px;color:var(--text-faint);}
.section-label{font-size:10.5px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.6px;font-weight:700;margin-bottom:8px;}
.report-table{width:100%;font-size:12px;border-collapse:collapse;}
.report-table th{text-align:left;color:var(--text-faint);font-size:10px;text-transform:uppercase;letter-spacing:0.4px;padding:6px 8px;}
.report-table td{padding:8px;border-top:1px solid var(--border);}
.report-table td.mono{font-family:monospace;}
.event-row{font-size:11.5px;color:var(--text-dim);display:flex;gap:8px;}
.event-time{font-family:monospace;color:var(--text-faint);flex-shrink:0;}
.confirm-overlay{position:fixed;inset:0;background:rgba(24,27,50,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
.confirm-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:28px 26px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(24,27,50,0.25);}
.confirm-check{width:46px;height:46px;border-radius:50%;background:#E6FBF3;color:#0B9268;border:1px solid #B7F0DC;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;margin:0 auto 12px;}
.confirm-card h3{font-size:16px;font-weight:700;margin-bottom:6px;}
.confirm-card p{font-size:12.5px;color:var(--text-dim);line-height:1.5;}
.confirm-card strong{color:var(--text);font-family:monospace;}
.toast{position:fixed;bottom:20px;right:20px;background:#fff;border:1px solid var(--border);padding:11px 16px;border-radius:8px;font-size:12.5px;max-width:300px;z-index:100;box-shadow:0 8px 24px rgba(24,27,50,0.15);}
.toast.error{border-color:#FFCAD2;color:var(--danger);}
.toast.success{border-color:#B7F0DC;color:#0B9268;}
footer{text-align:center;padding:20px;color:var(--text-faint);font-size:10.5px;font-family:monospace;}
@media (max-width:760px){ .split{grid-template-columns:1fr;} .stats{grid-template-columns:repeat(2,1fr);} }
`;
