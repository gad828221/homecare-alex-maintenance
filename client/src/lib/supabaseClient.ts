const supabaseUrl = 'https://hjrnfsdvrrwgyppqhwml.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE'

export const supabase = {
  from: (table: string) => ({
    insert: async (data: any) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify(data[0])
      })
      if (!response.ok) throw new Error(await response.text())
      return { data: await response.json(), error: null }
    },
    select: async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })
      if (!response.ok) throw new Error(await response.text())
      return { data: await response.json(), error: null }
    }
  })
}
