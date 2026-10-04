'use client';

import { WhatsappLogo } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { buildContactMessage, waLink } from '@/lib/whatsapp';

const SUBJECTS = ['Orçamento', 'Pedido em quantidade', 'Dúvida sobre um pedido', 'Outro assunto'];

export function ContactForm() {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');

  const send = () => window.open(waLink(buildContactMessage({ name, subject, message })), '_blank');

  return (
    <div className="flex max-w-[480px] flex-[1_1_340px] flex-col gap-4 pt-4">
      <h2 className="text-[26px]">Mande uma mensagem</h2>
      <Field label="Seu nome" htmlFor="contact-name">
        <input id="contact-name" className="input min-h-[44px] text-base" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Sobre o quê?" htmlFor="contact-subject">
        <select id="contact-subject" className="input min-h-[44px] text-base" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Mensagem" htmlFor="contact-message">
        <textarea id="contact-message" className="input min-h-[130px] text-base" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Conte o que você imaginou…" />
      </Field>
      <button type="button" className="btn btn-primary min-h-[46px] text-base" onClick={send}>
        <WhatsappLogo weight="duotone" size={18} /> Enviar pelo WhatsApp
      </button>
    </div>
  );
}
