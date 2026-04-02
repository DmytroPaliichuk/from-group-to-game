import UsMap from '@/components/UsMap'
import citiesData from '@/public/cities.json'

export default function Home() {
  const cities = citiesData.hometown

  return (
    <main className="flex flex-col items-center px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-wide text-slate-100 mb-5">
        Hometown Map
      </h1>
      <UsMap cities={cities} />
    </main>
  )
}
