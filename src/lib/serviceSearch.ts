import type { Service } from '../data'

/** Case-insensitive match on name, description, id, and category. */
export function matchesServiceQuery(service: Service, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    service.name,
    service.description,
    service.id,
    service.category ?? 'adult',
  ]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((word) => haystack.includes(word))
}

export function filterServices(services: Service[], query: string): Service[] {
  return services.filter((s) => matchesServiceQuery(s, query))
}
