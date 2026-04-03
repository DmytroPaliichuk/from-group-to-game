import Chat from '@/components/Chat'
import MapWithFilter from '@/components/MapWithFilter'

export default async function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cities: any[] = []
  try {
    const res = await fetch(`${process.env.API_URL}/athletes/hometowns`)
    const athletes = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cities = athletes.map((a: any) => ({
      city: a.hometown.city,
      state: a.hometown.state,
      lat: a.hometown.latitude,
      lng: a.hometown.longitude,
    }))
  } catch {
    // API unavailable — map renders with no cities
  }

  return (
    <main className="flex flex-row h-screen overflow-hidden">
      <MapWithFilter cities={cities} />
      <Chat />
    </main>
  )
}
