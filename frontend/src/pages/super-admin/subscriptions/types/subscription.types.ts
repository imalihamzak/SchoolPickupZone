export interface Plan {
  id: number
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
}

export interface Subscription {
  id: number
  planId: number
  adminId?: number // Optional if not included in query
  adminName: string
  schoolName: string
  status: 'active' | 'cancelled' | 'expired'
  startDate: string
  endDate: string
  lastPayment: number
  nextBilling: string
}


export interface Payment {
  id: number
  subscriptionId?: number 
  adminId?: number        
  adminName?: string
  amount: number
  status: 'Successful' | 'failed' | 'pending'
  date: string
  method: string
  planName: string      
  transactionId: string 
  schoolName: string      
}
