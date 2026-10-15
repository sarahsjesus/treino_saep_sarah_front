'use client';

import { FormEvent, useEffect, useState } from 'react';

type Product = {
  id: number;
  nome: string;
};

type FormMode = 'product' | 'movement';
type FormMessage = { kind: 'success' | 'error'; text: string } | null;

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://treinosaepsarah-production.up.railway.app/';

function localDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export default function Postar() {
  const [mode, setMode] = useState<FormMode>('product');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<FormMessage>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(`${apiUrl}/produtos`);
        if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
        setProducts(await response.json());
      } catch {
        setProductsError('Não foi possível carregar os produtos. Confira se a API está ativa.');
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = event.currentTarget;
    const values = new FormData(form);
    const isProduct = mode === 'product';
    const payload = isProduct
      ? {
          nome: values.get('nome'),
          valor: Number(values.get('valor')),
          quantidade: Number(values.get('quantidade')),
          categoria: values.get('categoria'),
        }
      : {
          produtos_id: Number(values.get('produtos_id')),
          tipo: values.get('tipo'),
          quantidade: Number(values.get('quantidade')),
          date: values.get('date'),
        };

    try {
      const response = await fetch(`${apiUrl}/${isProduct ? 'produtos' : 'movimentacoes'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar os dados.');

      form.reset();
      setMessage({
        kind: 'success',
        text: isProduct ? 'Produto cadastrado com sucesso.' : 'Movimentação registrada com sucesso.',
      });

      if (isProduct) {
        const productsResponse = await fetch(`${apiUrl}/produtos`);
        if (productsResponse.ok) setProducts(await productsResponse.json());
      }
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível conectar à API.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(nextMode: FormMode) {
    setMode(nextMode);
    setMessage(null);
  }

  return (
    <main className="page-shell">
      <div className="form-wrap">
        <p className="wordmark">ARMAZÉM <span>/</span> CONTROLE</p>
        <section className="entry-panel" aria-labelledby="page-title">
          <div className="panel-heading">
            <p className="eyebrow">REGISTRO DE ESTOQUE</p>
            <h1 id="page-title">O que vamos<br />registrar hoje?</h1>
            <p className="intro">Cadastre um produto ou lance uma movimentação no estoque.</p>
          </div>

          <div className="mode-switch" aria-label="Tipo de registro">
            <button
              type="button"
              className={mode === 'product' ? 'mode-button active' : 'mode-button'}
              aria-pressed={mode === 'product'}
              onClick={() => changeMode('product')}
            >
              Produto
            </button>
            <button
              type="button"
              className={mode === 'movement' ? 'mode-button active' : 'mode-button'}
              aria-pressed={mode === 'movement'}
              onClick={() => changeMode('movement')}
            >
              Movimentação
            </button>
          </div>

          <form key={mode} className="entry-form" onSubmit={handleSubmit}>
            {mode === 'product' ? (
              <>
                <div className="field">
                  <label htmlFor="nome">Nome do produto</label>
                  <input id="nome" name="nome" placeholder="Ex.: Café em grãos" required />
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="categoria">Categoria</label>
                    <input id="categoria" name="categoria" placeholder="Ex.: Mercearia" />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="valor">Valor unitário</label>
                    <div className="input-prefix">
                      <span>R$</span>
                      <input id="valor" name="valor" type="number" min="0" step="0.01" placeholder="0,00" required />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="quantidade">Quantidade inicial</label>
                    <input id="quantidade" name="quantidade" type="number" min="0" step="0.01" placeholder="0" required />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="produtos_id">Produto</label>
                  <select id="produtos_id" name="produtos_id" defaultValue="" required disabled={loadingProducts || products.length === 0}>
                    <option value="" disabled>
                      {loadingProducts ? 'Carregando produtos...' : 'Selecione um produto'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.nome}</option>
                    ))}
                  </select>
                  {productsError && <p className="field-note error-text">{productsError}</p>}
                  {!loadingProducts && !productsError && products.length === 0 && (
                    <p className="field-note">Cadastre um produto antes de lançar uma movimentação.</p>
                  )}
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor="tipo">Tipo de movimentação</label>
                    <select id="tipo" name="tipo" defaultValue="ENTRADA" required>
                      <option value="ENTRADA">Entrada</option>
                      <option value="SAIDA">Saída</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="quantidade">Quantidade</label>
                    <input id="quantidade" name="quantidade" type="number" min="0.01" step="0.01" placeholder="0" required />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="date">Data</label>
                  <input id="date" name="date" type="date" defaultValue={localDate()} required />
                </div>
              </>
            )}

            {message && (
              <p className={`form-message ${message.kind}`} role="status">
                {message.text}
              </p>
            )}

            <button className="submit-button" type="submit" disabled={isSubmitting || (mode === 'movement' && (loadingProducts || products.length === 0))}>
              {isSubmitting ? 'Salvando...' : mode === 'product' ? 'Cadastrar produto' : 'Registrar movimentação'}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
        </section>
        <p className="page-footnote">GESTÃO DE ESTOQUE <span>·</span>'</p>
      </div>
    </main>
  );
}

