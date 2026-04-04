const supabaseUrl = 'https://hjrnsfsdvrrwgyppqhwml.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE'

export const supabase = {
  from: (table: string) => ({
    insert: async (data: any) => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify(data[0])
        })
        
        if (!response.ok) {
          const error = await response.text()
          return { error: { message: error } }
        }
        
        return { data: await response.json(), error: null }
      } catch (err: any) {
        return { error: { message: err.message } }
      }
    },
    select: async (columns: string = '*') => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        })
        
        if (!response.ok) {
          const error = await response.text()
          return { error: { message: error } }
        }
        
        return { data: await response.json(), error: null }
      } catch (err: any) {
        return { error: { message: err.message } }
      }
    },
    update: (data: any) => ({
      eq: async (column: string, value: any) => {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify(data)
          })
          
          return { error: null }
        } catch (err: any) {
          return { error: { message: err.message } }
        }
      }
    })
  })
}
