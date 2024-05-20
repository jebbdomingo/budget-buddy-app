export class Api {
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

    async createTransaction(budget_id: number, account_id: number, amount: number, budget_month: string) {
        try {
            const options = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ budget_id: budget_id, account_id: account_id, amount: amount, budget_month: budget_month })
            }
            
            fetch("http://localhost:8787/api/fund_allocation", options)
                .then(response => response.json())
                // .then(data => (this.postId = data.id))
        } catch (error) {
            console.error(error)
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
    
    async getSnapshotsBy(budget_month: string) {
        try {
            const response = await fetch('http://localhost:8787/api/snapshots/month/' + budget_month)
            const result = await response.json()
            const snapshots = result.snapshots
            return snapshots
        } catch (error) {
            console.error(error)
        }
    }
}