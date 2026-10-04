'use client';

import { ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/ui/Field';
import { api, ApiError } from '@/lib/api/browser';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Preencha e-mail e senha.');
    setBusy(true);
    try {
      await api('/api/auth/login', { method: 'POST', json: { email: email.trim(), password } });
      router.push('/admin/produtos');
    } catch (err) {
      setError(err instanceof ApiError
        ? err.status === 429 ? 'Muitas tentativas. Aguarde um minuto e tente novamente.' : err.title
        : 'Não foi possível entrar. Verifique sua conexão.');
      setBusy(false);
    }
  };

  return (
    <section className="flex min-h-screen">
      <div className="box-border flex max-w-[680px] flex-[1_1_520px] flex-col justify-center gap-6 px-[clamp(24px,6vw,96px)] py-[48px]">
        <div className="flex items-center gap-2">
          <Image src="/img/logo.png" alt="" width={72} height={72} className="size-[72px] object-contain" />
          <Image src="/img/nome.png" alt="AG criando" width={130} height={38} className="h-[38px] w-auto" />
        </div>
        <div>
          <p className="mb-3 text-[13px] uppercase tracking-[0.16em] text-accent-700">Área administrativa</p>
          <h1 className="mb-3 text-[clamp(38px,5vw,56px)] leading-[1.05] tracking-[-0.02em]">Bem-vinda de volta.</h1>
          <p className="max-w-[420px] text-lg leading-normal text-neutral-800">Entre para cadastrar produtos, categorias e preços da loja.</p>
        </div>
        <form onSubmit={submit} noValidate className="flex max-w-[420px] flex-col gap-4">
          <Field label="E-mail" htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              className="input min-h-[46px] text-base"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </Field>
          <Field label="Senha" htmlFor="login-password">
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input min-h-[46px] pr-[48px] text-base"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-[2px] top-1/2 h-[42px] w-[44px] -translate-y-1/2 text-neutral-700"
              >
                {showPassword ? <EyeSlash weight="duotone" size={20} className="mx-auto" /> : <Eye weight="duotone" size={20} className="mx-auto" />}
              </button>
            </div>
          </Field>
          {error && <p role="alert" className="animate-fade text-[15px] text-accent-2-700">{error}</p>}
          <button type="submit" className="btn btn-primary min-h-[50px] text-base" disabled={busy}>Entrar</button>
        </form>
        <Link href="/" className="inline-flex items-center gap-[6px] text-sm"><ArrowLeft weight="duotone" />Voltar para a loja</Link>
      </div>
      <div className="hidden flex-[1_1_440px] items-center justify-center bg-surface p-[48px] wide:flex">
        <Image src="/img/logo.png" alt="AG criando Personalizados" width={560} height={560} className="aspect-square w-full max-w-[min(560px,calc(100vh-96px))] object-contain" />
      </div>
    </section>
  );
}
