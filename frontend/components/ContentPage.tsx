export default function ContentPage({ onMapPage }: { onMapPage: () => void }) {
  return (
    <div className="w-full h-full bg-[#0f172a] rounded-lg border border-[#1A1A1A] p-4 flex flex-col gap-3">
      <div className="flex items-center h-[52px]">
        <button
          onClick={onMapPage}
          className="h-12 bg-[#0B9FEA] hover:bg-[#0a8fd4] text-white text-sm font-medium px-6 rounded-full transition-colors"
        >
          &lt;&lt; Map Page
        </button>
      </div>
    </div>
  )
}
