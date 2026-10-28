import React from "react";
import {
  Utensils,
  Wine,
  ShoppingBag,
  Car,
  Home,
  Smartphone,
  Gamepad2,
  Plane,
  HeartPulse,
  GraduationCap,
  DollarSign,
  Tag,
  type LucideIcon,
} from "lucide-react";

const BASE_FINANCIAL_ICONS =
  "https://raw.githubusercontent.com/budgi-it/brazilian-financial-icons/835b29d98d5f30a57dfb6d8b20652f215e2e010a";
const WALLET_FALLBACK = "https://cdn.despezzas.com.br/svgs/carteira.svg";

export interface BankConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  textColor: string;
  borderColor: string;
  keywords: string[];
}

export const KNOWN_BANKS: BankConfig[] = [
  {
    id: "nubank",
    name: "Nubank",
    icon: `${BASE_FINANCIAL_ICONS}/nubank.svg`,
    color: "#820ad1",
    textColor: "#a855f7",
    borderColor: "#820ad140",
    keywords: ["nubank", "nu", "roxinho"],
  },
  {
    id: "itau",
    name: "Itaú",
    icon: `${BASE_FINANCIAL_ICONS}/itau.svg`,
    color: "#ec7000",
    textColor: "#fb923c",
    borderColor: "#ec700040",
    keywords: ["itau", "itaú"],
  },
  {
    id: "bradesco",
    name: "Bradesco",
    icon: `${BASE_FINANCIAL_ICONS}/bradesco.svg`,
    color: "#cc092f",
    textColor: "#f87171",
    borderColor: "#cc092f40",
    keywords: ["bradesco"],
  },
  {
    id: "inter",
    name: "Banco Inter",
    icon: `${BASE_FINANCIAL_ICONS}/banco-inter.svg`,
    color: "#ff7a00",
    textColor: "#fb923c",
    borderColor: "#ff7a0040",
    keywords: ["inter"],
  },
  {
    id: "santander",
    name: "Santander",
    icon: `${BASE_FINANCIAL_ICONS}/santander.svg`,
    color: "#ec0000",
    textColor: "#f87171",
    borderColor: "#ec000040",
    keywords: ["santander"],
  },
  {
    id: "bb",
    name: "Banco do Brasil",
    icon: `${BASE_FINANCIAL_ICONS}/banco-do-brasil.svg`,
    color: "#f8d117",
    textColor: "#facc15",
    borderColor: "#f8d11740",
    keywords: ["brasil", "bb"],
  },
  {
    id: "caixa",
    name: "Caixa",
    icon: `${BASE_FINANCIAL_ICONS}/caixa.svg`,
    color: "#0066b3",
    textColor: "#38bdf8",
    borderColor: "#0066b340",
    keywords: ["caixa", "cef"],
  },
  {
    id: "99pay",
    name: "99Pay",
    icon: `${BASE_FINANCIAL_ICONS}/99-pay.svg`,
    color: "#fdbb00",
    textColor: "#fbbf24",
    borderColor: "#fdbb0040",
    keywords: ["99", "99pay"],
  },
  {
    id: "picpay",
    name: "PicPay",
    icon: `${BASE_FINANCIAL_ICONS}/picpay.svg`,
    color: "#11c76f",
    textColor: "#34d399",
    borderColor: "#11c76f40",
    keywords: ["picpay"],
  },
  {
    id: "c6",
    name: "C6 Bank",
    icon: `${BASE_FINANCIAL_ICONS}/c6.svg`,
    color: "#242424",
    textColor: "#e2e8f0",
    borderColor: "#ffffff20",
    keywords: ["c6"],
  },
  {
    id: "mercadopago",
    name: "Mercado Pago",
    icon: `${BASE_FINANCIAL_ICONS}/mercado-pago.svg`,
    color: "#009ee3",
    textColor: "#38bdf8",
    borderColor: "#009ee340",
    keywords: ["mercado pago", "mercadopago"],
  },
  {
    id: "carteira",
    name: "Carteira / Dinheiro",
    icon: WALLET_FALLBACK,
    color: "#10b981",
    textColor: "#34d399",
    borderColor: "#10b98140",
    keywords: ["carteira", "dinheiro", "especie", "espécie", "caixa físico"],
  },
];

/**
 * Retorna a URL do SVG oficial do banco com base no nome da conta ou cartão.
 */
export function getBankIcon(name?: string | null): string {
  if (!name) return WALLET_FALLBACK;
  const nameLower = name.toLowerCase().trim();

  for (const bank of KNOWN_BANKS) {
    if (bank.keywords.some((kw) => nameLower.includes(kw) || nameLower === kw)) {
      return bank.icon;
    }
  }

  return WALLET_FALLBACK;
}

/**
 * Retorna configurações de estilo/cores associadas ao banco.
 */
export function getBankStyle(name?: string | null) {
  if (!name) {
    return {
      color: "#10b981",
      textColor: "#34d399",
      borderColor: "#10b98140",
    };
  }
  const nameLower = name.toLowerCase().trim();

  for (const bank of KNOWN_BANKS) {
    if (bank.keywords.some((kw) => nameLower.includes(kw) || nameLower === kw)) {
      return {
        color: bank.color,
        textColor: bank.textColor,
        borderColor: bank.borderColor,
      };
    }
  }

  return {
    color: "#6b7280",
    textColor: "#9ca3af",
    borderColor: "#6b728040",
  };
}

/**
 * Retorna o ícone do Lucide adequado para a categoria com base no nome.
 */
export function getCategoryIconComponent(name?: string | null): LucideIcon {
  if (!name) return Tag;
  const lower = name.toLowerCase();

  if (
    lower.includes("aliment") ||
    lower.includes("restauran") ||
    lower.includes("comida") ||
    lower.includes("ifood") ||
    lower.includes("lanche")
  ) {
    return Utensils;
  }
  if (
    lower.includes("bar") ||
    lower.includes("bebida") ||
    lower.includes("vinho") ||
    lower.includes("lazer")
  ) {
    return Wine;
  }
  if (
    lower.includes("compra") ||
    lower.includes("mercado") ||
    lower.includes("loja") ||
    lower.includes("supermercado")
  ) {
    return ShoppingBag;
  }
  if (
    lower.includes("transpor") ||
    lower.includes("uber") ||
    lower.includes("carro") ||
    lower.includes("gasolina") ||
    lower.includes("combustível")
  ) {
    return Car;
  }
  if (
    lower.includes("casa") ||
    lower.includes("aluguel") ||
    lower.includes("moradia") ||
    lower.includes("luz") ||
    lower.includes("água")
  ) {
    return Home;
  }
  if (
    lower.includes("celular") ||
    lower.includes("telefone") ||
    lower.includes("internet") ||
    lower.includes("assinatura") ||
    lower.includes("spotify") ||
    lower.includes("netflix") ||
    lower.includes("tv")
  ) {
    return Smartphone;
  }
  if (
    lower.includes("jogo") ||
    lower.includes("game") ||
    lower.includes("steam") ||
    lower.includes("psn") ||
    lower.includes("xbox") ||
    lower.includes("hobbie")
  ) {
    return Gamepad2;
  }
  if (
    lower.includes("viagem") ||
    lower.includes("ferias") ||
    lower.includes("voo") ||
    lower.includes("hotel")
  ) {
    return Plane;
  }
  if (
    lower.includes("saude") ||
    lower.includes("saúde") ||
    lower.includes("farmacia") ||
    lower.includes("medico") ||
    lower.includes("academia") ||
    lower.includes("cuidados") ||
    lower.includes("pet")
  ) {
    return HeartPulse;
  }
  if (
    lower.includes("educa") ||
    lower.includes("curso") ||
    lower.includes("faculdade") ||
    lower.includes("escola") ||
    lower.includes("livro")
  ) {
    return GraduationCap;
  }
  if (
    lower.includes("salario") ||
    lower.includes("salário") ||
    lower.includes("renda") ||
    lower.includes("invest")
  ) {
    return DollarSign;
  }

  return Tag;
}
