import Chat from '@/components/Chat'
import UsMap from '@/components/UsMap'
import citiesData from '@/public/cities.json'

export default function Home() {
  const cities = citiesData.hometown

  return (
    <main className="flex flex-row h-screen overflow-hidden">
      <section className="flex flex-col items-center flex-1 px-4 py-6 overflow-y-auto">
        <h1 className="text-2xl font-semibold tracking-wide text-slate-100 mb-5">
          Hometown Map
        </h1>
        <UsMap cities={cities} />
      </section>
      <Chat />
    </main>
  )
}
