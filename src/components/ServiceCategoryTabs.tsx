export type ServiceCategoryFilter = 'all' | 'adult' | 'men' | 'care' | 'kids'

const TABS: { id: ServiceCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'adult', label: 'Adult' },
  { id: 'men', label: 'Men' },
  { id: 'care', label: 'Care' },
  { id: 'kids', label: 'Kids' },
]

export function ServiceCategoryTabs({
  value,
  onChange,
  counts,
}: {
  value: ServiceCategoryFilter
  onChange: (next: ServiceCategoryFilter) => void
  /** Optional counts shown on each tab */
  counts?: Partial<Record<ServiceCategoryFilter, number>>
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Service categories"
    >
      {TABS.map((tab) => {
        const active = value === tab.id
        const count = counts?.[tab.id]
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              active
                ? 'bg-accent text-white'
                : 'bg-lilac/80 text-brand/75 hover:bg-lilac hover:text-brand'
            }`}
          >
            {tab.label}
            {typeof count === 'number' && (
              <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-brand/45'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
