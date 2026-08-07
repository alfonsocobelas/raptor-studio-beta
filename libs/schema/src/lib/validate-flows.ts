import { BusinessFlow, FLOW_LIMITS, FlowNode } from './app-types'

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

// Gate estructural de los flujos de negocio (spec 28). `entity` no se valida
// aquí: defineApp no conoce los recursos, igual que con widget.resource.
export function validateFlows(flows: BusinessFlow[] | undefined): string[] {
  if (!flows?.length) return []

  const problems: string[] = []

  if (flows.length > FLOW_LIMITS.flows) {
    problems.push(`flows: at most ${FLOW_LIMITS.flows} flows are allowed (found ${flows.length})`)
  }

  const seenNames = new Set<string>()
  flows.forEach((flow, index) => {
    if (seenNames.has(flow.name)) problems.push(`flows: duplicated flow name '${flow.name}'`)
    seenNames.add(flow.name)
    problems.push(...validateFlow(flow, `flows[${index}]`))
  })

  return problems
}

function validateFlow(flow: BusinessFlow, at: string): string[] {
  return [
    ...validateTexts(flow, at),
    ...validateNodes(flow.nodes, at),
    ...validateEdges(flow, at),
    ...validateShape(flow, at)
  ]
}

function validateTexts(flow: BusinessFlow, at: string): string[] {
  const problems: string[] = []

  if (!flow.name.length || flow.name.length > FLOW_LIMITS.name) {
    problems.push(`${at}: name must be 1-${FLOW_LIMITS.name} characters`)
  }
  if (flow.description !== undefined && flow.description.length > FLOW_LIMITS.description) {
    problems.push(`${at}: description must be at most ${FLOW_LIMITS.description} characters`)
  }

  return problems
}

function validateNodes(nodes: FlowNode[], at: string): string[] {
  const problems: string[] = []

  if (nodes.length > FLOW_LIMITS.nodes) {
    problems.push(`${at}: at most ${FLOW_LIMITS.nodes} nodes are allowed (found ${nodes.length})`)
  }

  const seen = new Set<string>()
  nodes.forEach((node, index) => {
    if (!KEBAB_CASE.test(node.id)) problems.push(`${at}.nodes[${index}]: id must be non-empty kebab-case`)
    if (seen.has(node.id)) problems.push(`${at}: duplicated node id '${node.id}'`)
    seen.add(node.id)
    if (!node.text.length || node.text.length > FLOW_LIMITS.text) {
      problems.push(`${at}.nodes[${index}]: text must be 1-${FLOW_LIMITS.text} characters`)
    }
  })

  return problems
}

function validateEdges(flow: BusinessFlow, at: string): string[] {
  const problems: string[] = []
  const kindOf = new Map(flow.nodes.map(node => [node.id, node.kind]))

  if (flow.edges.length > FLOW_LIMITS.edges) {
    problems.push(`${at}: at most ${FLOW_LIMITS.edges} edges are allowed (found ${flow.edges.length})`)
  }

  const seen = new Set<string>()
  flow.edges.forEach((edge, index) => {
    for (const end of [edge.from, edge.to]) {
      if (!kindOf.has(end)) problems.push(`${at}.edges[${index}]: unknown node '${end}'`)
    }
    if (edge.from === edge.to) problems.push(`${at}.edges[${index}]: self-loop on '${edge.from}' is not allowed`)

    const key = `${edge.from}→${edge.to}→${edge.label ?? ''}`
    if (seen.has(key)) problems.push(`${at}: duplicated edge from '${edge.from}' to '${edge.to}'`)
    seen.add(key)

    if (kindOf.get(edge.from) === 'decision' && edge.label === undefined) {
      problems.push(`${at}.edges[${index}]: edge from decision '${edge.from}' requires a label`)
    }
    if (edge.label !== undefined && (!edge.label.length || edge.label.length > FLOW_LIMITS.label)) {
      problems.push(`${at}.edges[${index}]: label must be 1-${FLOW_LIMITS.label} characters`)
    }
  })

  return problems
}

function validateShape(flow: BusinessFlow, at: string): string[] {
  const problems: string[] = []
  const starts = flow.nodes.filter(node => node.kind === 'start')

  if (starts.length !== 1) problems.push(`${at}: exactly one start node is required (found ${starts.length})`)
  if (!flow.nodes.some(node => node.kind === 'end')) problems.push(`${at}: at least one end node is required`)

  const outgoing = new Map<string, number>()
  flow.edges.forEach(edge => outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1))

  flow.nodes.forEach(node => {
    const count = outgoing.get(node.id) ?? 0
    if (node.kind === 'decision' && count < 2) {
      problems.push(`${at}: decision '${node.id}' requires at least 2 outgoing edges (found ${count})`)
    }
    if ((node.kind === 'step' || node.kind === 'start') && count !== 1) {
      problems.push(`${at}: ${node.kind} '${node.id}' requires exactly one outgoing edge (found ${count})`)
    }
    if (node.kind === 'end' && count > 0) problems.push(`${at}: end '${node.id}' must not have outgoing edges`)
  })

  if (starts.length === 1) problems.push(...validateReachability(flow, starts[0].id, at))

  return problems
}

function validateReachability(flow: BusinessFlow, start: string, at: string): string[] {
  const ids = new Set(flow.nodes.map(node => node.id))
  const reached = new Set([start])
  const queue = [start]

  while (queue.length) {
    const current = queue.shift() as string
    for (const edge of flow.edges) {
      if (edge.from !== current || reached.has(edge.to) || !ids.has(edge.to)) continue
      reached.add(edge.to)
      queue.push(edge.to)
    }
  }

  return flow.nodes
    .filter(node => !reached.has(node.id))
    .map(node => `${at}: node '${node.id}' is unreachable from the start`)
}
