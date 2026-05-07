export default function ContentPage({ onMapPage }: { onMapPage: () => void }) {
  return (
    <div className="w-full h-full bg-slate-800 rounded-2xl p-4 flex flex-col">
      <div>
        <button
          onClick={onMapPage}
          className="bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm px-4 py-2 rounded-xl border border-slate-600 transition-colors"
        >
          &lt;&lt; Map Page
        </button>
      </div>
    </div>
  )
}
