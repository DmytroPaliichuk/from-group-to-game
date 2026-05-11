import ResizableLayout from '@/components/ResizableLayout'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cities: any[] = []
  try {
    const res = await fetch(`${process.env.API_URL}/athletes/hometowns`)
    const athletes = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cityMap = new Map<string, { city: string; state: string; lat: number; lng: number; athletes: { first_name: string; last_name: string; olympic_paralympic: string; seasons: string[]; medals: { gold: number; silver: number; bronze: number }; sports: string[]; thumbnail: string; birthday: string | null; education: string | null; fun_fact: string | null; biography: string | null }[] }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    athletes.forEach((a: any) => {
      const key = `${a.hometown.city}|${a.hometown.state}`
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: a.hometown.city,
          state: a.hometown.state,
          lat: a.hometown.latitude,
          lng: a.hometown.longitude,
          athletes: [],
        })
      }
      cityMap.get(key)!.athletes.push({ first_name: a.first_name, last_name: a.last_name, olympic_paralympic: a.olympic_paralympic ?? '', seasons: a.seasons ?? [], medals: a.medals ?? { gold: 0, silver: 0, bronze: 0 }, sports: a.sports ?? [], thumbnail: a.thumbnail_image_list?.[0]?.secure_url ?? '', birthday: a.birthday ?? null, education: a.education ?? null, fun_fact: a.fun_fact ?? null, biography: a.biography ?? null })
    })
    cities = Array.from(cityMap.values())
  } catch {
    // API unavailable — map renders with no cities
  }

  return <ResizableLayout cities={cities} />
}
