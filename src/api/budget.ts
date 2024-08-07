// @ts-nocheck

import { type Allocation, type Transaction } from '../types/types'

export class BudgetApi {
    private API_HOST = import.meta.env.VITE_API_HOST

    async getBudgets() {
        try {
            const response = await fetch(this.API_HOST + '/api/budgets')
            const result = await response.json()
            return result.budgets
        } catch (error) {
            console.error(error)
        }
    }
    
    async getAccounts() {
        try {
            const response = await fetch(this.API_HOST + '/api/accounts')
            const result = await response.json()
            return result.accounts
        } catch (error) {
            console.error(error)
        }
    }
    
    /**
     * Fetch accounts with running balances
     * 
     * @returns [accounts] or { error: error}
     */
    async getAccountBalances() {
        try {
            const response = await fetch(this.API_HOST + '/api/accountbalances')
            const result = await response.json()

            if (result.accounts) {
                return result.accounts
            } else {
                return { error: result.err }
            }
        } catch (error) {
            console.error(error)
            return { error: error }
        }
    }

    async getTransactionsByType(type: string, id: number, month?: string) {
        try {
            let url: string = ''

            if (typeof month !== 'undefined') {
                url = this.API_HOST + '/api/transactions/filter/' + type + '/' + id + '/' + month
            } else {
                url = this.API_HOST + '/api/transactions/filter/' + type + '/' + id
            }

            console.log(url)

            const response = await fetch(url)
            const result = await response.json()
            return result.transactions
        } catch (error) {
            console.error(error)
        }
    }

    async createTransaction(transaction: Transaction) {
        try {
            transaction.budget_id = transaction.budget.budget_id
            
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transaction)
            }
            
            const response = await fetch(this.API_HOST + "/api/fund_allocation", options)
            const result = await response.json()
            return { ok: result.ok, result: result.transaction, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async updateTransaction(transaction: Transaction) {
        try {
            const options = {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transaction)
            }
            
            const response = await fetch(this.API_HOST + "/api/fund_allocation", options)
            const result = await response.json()
            return { ok: true, result: result.transaction, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async getTransactions() {
        try {
            const response = await fetch(this.API_HOST + '/api/transactions')
            const result = await response.json()
            return result.transactions
        } catch (error) {
            console.error(error)
        }
    }
    
    async createBudget(title: string) {
        try {
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title })
            }
            
            const response = await fetch(this.API_HOST + "/api/budgets", options)
            const result = await response.json()
            return { ok: result.budget ? true : false, budget: result.budget, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async updateBudget(budget_id: number, title: string) {
        try {
            const options = {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ budget_id: budget_id, title: title })
            }
            
            const response = await fetch(this.API_HOST + "/api/budgets", options)
            const result = await response.json()
            return { ok: result.budget ? true : false, result: result.budget, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async archiveBudget(id: number) {
        try {
            const response = await fetch(this.API_HOST + '/api/budgets/archive/' + id)
            const result = await response.json()

            return { ok: result.ok, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async archiveAccount(id: number) {
        try {
            const response = await fetch(this.API_HOST + '/api/accounts/archive/' + id)
            const result = await response.json()

            return { ok: result.ok, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }
    
    async createAccount(title: string) {
        try {
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title })
            }
            
            const response = await fetch(this.API_HOST + "/api/accounts", options)
            const result = await response.json()
            return { ok: true, account: result.account, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }
    
    async updateAccount(account_id: number, title: string) {
        try {
            const options = {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ account_id: account_id, title: title })
            }
            
            const response = await fetch(this.API_HOST + "/api/accounts", options)
            const result = await response.json()
            return { ok: true, result: result.account, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    // async getSnapshots() {
    //     try {
    //         const response = await fetch(this.API_HOST + '/api/snapshots')
    //         const result = await response.json()
    //         const snapshots = result.snapshots
    //         return snapshots
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }

    async createAllocation(allocation: Allocation) {
        try {
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(allocation)
            }
            
            const response = await fetch(this.API_HOST + "/api/allocations", options)
            const result = await response.json()
            return { ok: result.ok, result: result.allocation, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async getAllocations() {
        try {
            const response = await fetch(this.API_HOST + '/api/allocations')
            const result = await response.json()
            return result.allocations
        } catch (error) {
            console.error(error)
        }
    }
    
    async getBudgetsBalances() {
        try {
            const response = await fetch(this.API_HOST + '/api/budgetsbalances')
            const res = await response.json()
            const data = res.data
            
            return data
        } catch (error) {
            console.error(error)
        }
    }
    
    // async getSnapshotsBy(budget_month: string) {
    //     try {
    //         const response = await fetch(this.API_HOST + '/api/snapshots/month/' + budget_month)
    //         const result = await response.json()
    //         const snapshots = result.snapshots
    //         return snapshots
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }
}