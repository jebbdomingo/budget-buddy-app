export interface Transaction {
	transaction_id: number
    budget_id: number
    account_id: number
    transaction_type: string
    transaction_date: string
    amount: number
    budget_month: string
    payee: string
	memo: string
}

export interface Account {
	account_id: number
	title: string
	balance: number
}

export interface AccountTransaction {
	account_id: number
	amount: number
    transaction_type: string
}

export interface Budget {
	budget_id: number
	title: string
}

export interface BudgetTransaction {
	budget_id: number
    transaction_type: string
	budget_month: string
    title: string
	amount: number
}