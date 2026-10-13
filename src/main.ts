import "./style.css";
import { CATEGORIAS } from "./types";
import type { Categoria, Despesa, TotaisPorCategoria } from "./types";

// ---------- Elementos que já existem no index.html ----------

function buscarElemento<T extends Element>(seletor: string): T {
  const elemento = document.querySelector<T>(seletor);
  if (!elemento) {
    throw new Error(`Elemento não encontrado: ${seletor}`);
  }
  return elemento;
}

const form = buscarElemento<HTMLFormElement>("#form-despesa");
const inputTitulo = buscarElemento<HTMLInputElement>("#input-titulo");
const inputValor = buscarElemento<HTMLInputElement>("#input-valor");
const selectCategoria = buscarElemento<HTMLSelectElement>("#select-categoria");
const erroFormulario = buscarElemento<HTMLParagraphElement>("#erro-formulario");
const listaDespesas = buscarElemento<HTMLUListElement>("#lista-despesas");
const listaVazia = buscarElemento<HTMLParagraphElement>("#lista-vazia");
const templateDespesa = buscarElemento<HTMLTemplateElement>("#template-despesa");
const totalGeral = buscarElemento<HTMLElement>("#total-geral");
const totaisCategoria = document.querySelectorAll<HTMLElement>("[data-total-categoria]");

// ---------- Estado ----------

let despesas: Despesa[] = [];

// ---------- Funções auxiliares ----------

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor);
}

function ehCategoria(valor: string | undefined): valor is Categoria {
  return CATEGORIAS.includes(valor as Categoria);
}

// ---------- Cálculos ----------

function calcularTotal(): number {
  return despesas.reduce((soma, despesa) => soma + despesa.valor, 0);
}

function calcularTotalPorCategoria(): TotaisPorCategoria {
  const totais: TotaisPorCategoria = {
    Alimento: 0,
    Transporte: 0,
    Lazer: 0,
    Saúde: 0,
    Outros: 0,
  };

  for (const despesa of despesas) {
    totais[despesa.categoria] += despesa.valor;
  }

  return totais;
}

// ---------- Ações sobre o estado ----------

function adicionarDespesa(titulo: string, valor: number, categoria: Categoria): void {
  const novaDespesa: Despesa = {
    id: crypto.randomUUID(),
    titulo,
    valor,
    categoria,
  };

  // A mais recente fica no topo da lista
  despesas = [novaDespesa, ...despesas];
  atualizarTela();
}

function removerDespesa(id: string): void {
  despesas = despesas.filter((despesa) => despesa.id !== id);
  atualizarTela();
}

// ---------- Atualização da tela ----------

function criarItemDespesa(despesa: Despesa): HTMLLIElement {
  const item = templateDespesa.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
  item.dataset.id = despesa.id;

  item.querySelector(".despesa__titulo")!.textContent = despesa.titulo;
  item.querySelector(".despesa__valor")!.textContent = formatarMoeda(despesa.valor);

  const categoria = item.querySelector<HTMLElement>(".despesa__categoria")!;
  categoria.textContent = despesa.categoria;
  categoria.dataset.categoria = despesa.categoria;

  item.querySelector(".despesa__remover")!.setAttribute("aria-label", `Remover ${despesa.titulo}`);

  return item;
}

function atualizarLista(): void {
  const itens = despesas.map(criarItemDespesa);
  listaDespesas.replaceChildren(...itens);
  listaVazia.hidden = despesas.length > 0;
}

function atualizarResumo(): void {
  totalGeral.textContent = formatarMoeda(calcularTotal());

  const totais = calcularTotalPorCategoria();
  for (const elemento of totaisCategoria) {
    const categoria = elemento.dataset.totalCategoria;
    if (ehCategoria(categoria)) {
      elemento.textContent = formatarMoeda(totais[categoria]);
    }
  }
}

function atualizarTela(): void {
  atualizarLista();
  atualizarResumo();
}

// ---------- Formulário ----------

function mostrarErro(mensagem: string): void {
  erroFormulario.textContent = mensagem;
  erroFormulario.hidden = false;
}

function esconderErro(): void {
  erroFormulario.textContent = "";
  erroFormulario.hidden = true;
}

function validarFormulario(titulo: string, valor: number, categoria: string): string | null {
  if (titulo === "") {
    return "Informe o título da despesa.";
  }
  if (!(valor > 0)) {
    return "Informe um valor maior que zero.";
  }
  if (!ehCategoria(categoria)) {
    return "Selecione uma categoria.";
  }
  return null;
}

function aoEnviarFormulario(evento: SubmitEvent): void {
  evento.preventDefault();

  const titulo = inputTitulo.value.trim();
  const valor = Number(inputValor.value);
  const categoria = selectCategoria.value;

  const erro = validarFormulario(titulo, valor, categoria);
  if (erro) {
    mostrarErro(erro);
    return;
  }

  esconderErro();
  adicionarDespesa(titulo, valor, categoria as Categoria);
  form.reset();
  inputTitulo.focus();
}

function aoClicarNaLista(evento: MouseEvent): void {
  const alvo = evento.target as HTMLElement;
  const botaoRemover = alvo.closest(".despesa__remover");
  if (!botaoRemover) return;

  const item = botaoRemover.closest<HTMLLIElement>(".despesa");
  if (item?.dataset.id) {
    removerDespesa(item.dataset.id);
  }
}

// ---------- Eventos ----------

form.addEventListener("submit", aoEnviarFormulario);
listaDespesas.addEventListener("click", aoClicarNaLista);

atualizarTela();
