export class BudgetApi {
    async getBudgets() {
        try {
            const response = await fetch('http://localhost:8787/api/budgets')
            const result = await response.json()
            return result.budgets
        } catch (error) {
            console.error(error)
        }
    }
    
    async getAccounts() {
        try {
            const response = await fetch('http://localhost:8787/api/accounts')
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
            const response = await fetch('http://localhost:8787/api/accountbalances')
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

    async getTransactionsByType(type: string, id: number) {
        try {
            const response = await fetch('http://localhost:8787/api/transactions/filter/' + type + '/' + id)
            const result = await response.json()
            return result.transactions
        } catch (error) {
            console.error(error)
        }
    }

    async createTransaction(
        budget_id: number,
        account_id: number,
        amount: number,
        budget_month: string
    ) {
        try {
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ budget_id: budget_id, account_id: account_id, amount: amount, budget_month: budget_month })
            }
            
            const response = await fetch("http://localhost:8787/api/fund_allocation", options)
            const result = await response.json()
            return { ok: result.ok, result: result.transaction, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }
    
    async createBudget(title: string) {
        try {
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title })
            }
            
            const response = await fetch("http://localhost:8787/api/budgets", options)
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
            
            const response = await fetch("http://localhost:8787/api/budgets", options)
            const result = await response.json()
            return { ok: result.budget ? true : false, result: result.budget, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async archiveBudget(id: number) {
        try {
            const response = await fetch('http://localhost:8787/api/budgets/archive/' + id)
            const result = await response.json()

            return { ok: result.ok, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    async archiveAccount(id: number) {
        try {
            const response = await fetch('http://localhost:8787/api/accounts/archive/' + id)
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
            
            const response = await fetch("http://localhost:8787/api/accounts", options)
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
            
            const response = await fetch("http://localhost:8787/api/accounts", options)
            const result = await response.json()
            return { ok: true, result: result.account, message: result.error }
        } catch (error) {
            console.error(error)
            return { ok: false, message: error }
        }
    }

    // async getSnapshots() {
    //     try {
    //         const response = await fetch('http://localhost:8787/api/snapshots')
    //         const result = await response.json()
    //         const snapshots = result.snapshots
    //         return snapshots
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }
    
    async getBudgetsBalances() {
        try {
            const response = await fetch('http://localhost:8787/api/budgetsbalances')
            const res = await response.json()
            const data = res.data
            
            return data
        } catch (error) {
            console.error(error)
        }
    }
    
    // async getSnapshotsBy(budget_month: string) {
    //     try {
    //         const response = await fetch('http://localhost:8787/api/snapshots/month/' + budget_month)
    //         const result = await response.json()
    //         const snapshots = result.snapshots
    //         return snapshots
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }
}