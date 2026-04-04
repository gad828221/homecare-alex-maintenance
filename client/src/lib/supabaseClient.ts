const supabaseUrl = 'https://hjrnsfsdvrrwgyppqhwml.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqcm5mc2R2cnJ3Z3lwcHFod21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjMwNjgsImV4cCI6MjA5MDgzOTA2OH0.1l5C5QnWP-BfqM3GRyAXskkj9JvrlD2ucOtnUkgRVKE'

// دالة بسيطة للإضافة باستخدام fetch العادي
export async function addOrder(orderData: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify(orderData)
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error)
  }
  
  return response.json()
}

// دالة بسيطة للقراءة
export async function getOrders() {
  const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  return response.json()
}
