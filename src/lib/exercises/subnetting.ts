export type SubnetAnswer = {
  prefix: string
  mask: string
  magic: string
  hosts: string
  rows: [string, string, string, string][]
}
export type SubnetProblem = { network: string; subnets: 4 | 8 | 16; answer: SubnetAnswer }
export type SubnetInput = Omit<SubnetAnswer, 'rows'> & { rows: string[][] }

const OCTETS = [0, 1, 10, 20, 50, 100]
const SUBNETS = [4, 8, 16] as const
const ROWS = 3

export function generateSubnetting(rand: () => number): SubnetProblem {
  const octet = OCTETS[Math.floor(rand() * OCTETS.length)]
  const subnets = SUBNETS[Math.floor(rand() * SUBNETS.length)]
  const bits = Math.log2(subnets)
  const m = 256 >> bits
  const base = `192.168.${octet}.`
  const rows = Array.from({ length: ROWS }, (_, i): [string, string, string, string] => [
    base + i * m,
    base + (i * m + 1),
    base + (i * m + m - 2),
    base + (i * m + m - 1),
  ])
  return {
    network: `${base}0/24`,
    subnets,
    answer: {
      prefix: `/${24 + bits}`,
      mask: '255.255.255.' + (256 - m),
      magic: String(m),
      hosts: String(m - 2),
      rows,
    },
  }
}

const norm = (s: string | undefined) => (s ?? '').trim().replace(/,/g, '.') // iPhone con coma decimal
const normPrefix = (s: string | undefined) => norm(s).replace(/^\//, '')

export function gradeSubnetting(answer: SubnetAnswer, input: SubnetInput) {
  const fields: Record<string, boolean> = {
    prefix: normPrefix(input.prefix) === normPrefix(answer.prefix),
    mask: norm(input.mask) === norm(answer.mask),
    magic: norm(input.magic) === norm(answer.magic),
    hosts: norm(input.hosts) === norm(answer.hosts),
  }
  answer.rows.forEach((row, r) =>
    row.forEach((v, c) => {
      fields[`r${r}c${c}`] = norm(input.rows[r]?.[c]) === v
    }),
  )
  const correct = Object.values(fields).filter(Boolean).length
  return { fields, correct, total: 16 as const, score: correct / 16 }
}

export function explainSubnetting(p: SubnetProblem): string[] {
  const { prefix, mask, magic, hosts, rows } = p.answer
  const bits = Math.log2(p.subnets)
  return [
    `Parte de la red ${p.network}: tiene 8 bits de host en el último octeto.`,
    `Necesitas ${p.subnets} subredes: 2^${bits} = ${p.subnets}, así que prestas ${bits} bits de host.`,
    `El nuevo prefijo es /24 + ${bits} = ${prefix}.`,
    `La máscara queda ${mask}.`,
    `El salto (magic number) es 256 - ${256 - Number(magic)} = ${magic}: cada subred empieza ${magic} direcciones después de la anterior.`,
    `Hosts por subred: ${magic} - 2 = ${hosts}. La primera subred va de ${rows[0][0]} a ${rows[0][3]}; la siguiente empieza en ${rows[1][0]}.`,
  ]
}
