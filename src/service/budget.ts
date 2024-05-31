import { toValue, watchEffect, ref, watch } from 'vue'
import { Api } from '../api'

export const oBudgetSnapshots = ref(null)
export const oBudgets = ref(null)
export const snapshot = ref(null)

/**
 * Generate budgets balances data structure for app presentation
 */
export async function useSnapshotGenerator() {
    const api = new Api

    oBudgets.value = JSON.parse(localStorage.getItem('BudgetView:Budgets')) || null
    oBudgetSnapshots.value = JSON.parse(localStorage.getItem('BudgetView:Snapshots')) || null
    let balances = JSON.parse(localStorage.getItem('BudgetView:Balances')) || null
    
    if (!toValue(oBudgetSnapshots)) {
        oBudgets.value = await api.getBudgets()
        balances = await api.getBudgetsBalances()

        localStorage.setItem('BudgetView:Budgets', JSON.stringify(toValue(oBudgets)))
        localStorage.setItem('BudgetView:Balances', JSON.stringify(balances))
    }
    
    const generate = () => {
        console.log('useSnapshotGenerator::generate()')

        // Generate past months and two future months from today's date
        const date = new Date()
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const dates: [string] = []

        for (let i = 1; i <= (month + 2); i++) {
            dates.push(i + '-' + year)
        }

        const data: any = []
        const lastRunningBalance = {}

        dates.forEach(month => {
            let oMonths = { month: month, budgets: [] = [] }
            
            const result = toValue(oBudgets)
            result.forEach(budget => {
                let cBudget = {} // Temporary budget container
                cBudget.budget_id = budget.budget_id
                cBudget.title = budget.title

                let hasBudgetBalance = false

                // Search for the transaction balances (assigned and available balance) for the corresponding budget
                balances.forEach(budgetBalance => {
                    if (budget.budget_id == budgetBalance.budget_id && month == budgetBalance.budget_month) {
                        cBudget.assigned = budgetBalance.assigned
                        cBudget.available = budgetBalance.available

                        hasBudgetBalance = true

                        // Use to track the last known balance of a budget
                        lastRunningBalance[budgetBalance.budget_id] = {
                            budget_id: budgetBalance.budget_id,
                            title: budget.title,
                            budget_month: budgetBalance.budget_month,
                            assigned: budgetBalance.assigned,
                            available: budgetBalance.available
                        }
                    }
                })

                // Filling of the budget months where there's no budget activity
                if (!hasBudgetBalance) {
                    // In the case of no budget activity for this month
                    // use the available balance of the budget from the latest activity
                    if (lastRunningBalance[budget.budget_id]) {
                        const oEnding = lastRunningBalance[budget.budget_id]

                        if (oEnding.budget_month != month) {
                            oEnding.assigned = 0
                        }

                        cBudget = oEnding
                    } else {
                        cBudget.assigned = 0
                        cBudget.available = 0
                    }
                }

                // Populate all the budgets with assigned and available funds per month
                oMonths.budgets.push(cBudget)
            })
            
            data.push(oMonths)
        })

        oBudgetSnapshots.value = data
    }

    watch(oBudgets.value, (newValue) => {
        console.log('useSnapshotGenerator::watch:oBudgets')
        localStorage.setItem('BudgetView:Budgets', JSON.stringify(toValue(newValue)))
        generate()
    })
    
    watch(oBudgetSnapshots, (newValue) => {
        console.log('useSnapshotGenerator::watch:oBudgetSnapshots')
        localStorage.setItem('BudgetView:Snapshots', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    if (!toValue(oBudgetSnapshots)) {
        generate()
    }
}

/**
 * Dynamically re-calculate all the budget snapshots for presentation
 * 
 * @param transaction   New transaction
 */
export async function useRecalculateSnapshots(transaction: {}) {
    const result = oBudgetSnapshots.value

    result.forEach(row => {
        const snapshot = {
            budget_id: transaction.budget_id,
            title: null,
            assigned: 0,
            available: 0
        }
        
        if (row.month == transaction.budget_month) {
            row.budgets.forEach((budget, index) => {
                if (budget.budget_id == transaction.budget_id) {
                    snapshot.title = budget.title
                    snapshot.assigned = budget.assigned + transaction.amount
                    snapshot.available = budget.available + transaction.amount
                    row.budgets[index] = snapshot
                }
            })
        } else if (row.month > transaction.budget_month) {
            row.budgets.forEach((budget, index) => {
                if (budget.budget_id == transaction.budget_id) {
                    snapshot.title = budget.title
                    snapshot.assigned = budget.assigned
                    snapshot.available = budget.available + transaction.amount
                    row.budgets[index] = snapshot
                }
            })
        }
    })
}

/**
 * Snapshot selector
 * 
 * @param date 
 */
export function useSnapshotSelector(date) {
    // Generate snapshots data structure
    useSnapshotGenerator()

    const selectSnapshot = () => {
        const oDate = new Date(toValue(date))
        const month = oDate.getMonth() + 1
        const year = oDate.getFullYear()
        const budgetMonth = month + '-' + year
    
        let result: []
        result = toValue(oBudgetSnapshots)
        if (result) {
            result.forEach(row => {
                if (row.month == budgetMonth) {
                    snapshot.value = row.budgets
                }
            });
        }
    }

    watchEffect(() => {
        selectSnapshot()
    })
}