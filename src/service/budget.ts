import { toValue, watchEffect, ref, onMounted, watch } from 'vue'
import { Api } from '../api'

const oBudgetSnapshots = ref(null)
const oBudgets = ref(null)

/**
 * Generate budgets balances data structure for app presentation
 * 
 * @param date The date from which we generate the past months and the two future months of budgeting
 */
export async function useSnapshotGenerator(date: any) {
    const api = new Api

    oBudgets.value = JSON.parse(localStorage.getItem('BudgetView:Budgets')) || null
    let balances = JSON.parse(localStorage.getItem('BudgetView:Balances')) || null
    
    if (!toValue(oBudgets)) {
        oBudgets.value = await api.getBudgets()
        localStorage.setItem('BudgetView:Budgets', JSON.stringify(toValue(oBudgets)))
    }
    
    if (!balances) {    
        balances = await api.getBudgetsBalances()
        localStorage.setItem('BudgetView:Balances', JSON.stringify(balances))
    }
    
    const generate = () => {
        // Generate past months and two future months from today's date
        const oDate = new Date(toValue(date))
        const month = oDate.getMonth() + 1
        const year = oDate.getFullYear()

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
                let budgets = {}
                budgets.budget_id = budget.budget_id
                budgets.title = budget.title

                let hasBudgetBalance = false

                balances.forEach(budgetBalance => {
                    if (budget.budget_id == budgetBalance.budget_id && month == budgetBalance.budget_month) {
                        budgets.assigned = budgetBalance.assigned
                        budgets.available = budgetBalance.available

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

                if (!hasBudgetBalance) {
                    if (lastRunningBalance[budget.budget_id]) {
                        const oEnding = lastRunningBalance[budget.budget_id]

                        if (oEnding.budget_month != month) {
                            oEnding.assigned = 0
                        }

                        budgets = oEnding
                    } else {
                        budgets.assigned = 0
                        budgets.available = 0
                    }
                }

                oMonths.budgets.push(budgets)
            })
            
            data.push(oMonths)
        })

        oBudgetSnapshots.value = data
    }

    watchEffect(() => {
        console.log('useSnapshotGenerator::watchEffect')
        localStorage.setItem('BudgetView:Budgets', JSON.stringify(toValue(oBudgets)))
        generate()
    })
}

/**
 * Dynamically re-calculate all the budget snapshots for presentation
 * 
 * @param transaction   New transaction
 */
export async function useRecalculateSnapshots(transaction: {}) {
    const result = toValue(oBudgetSnapshots)

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
 * @param snapshot Reactive from the client code to set the selected snapshot with
 */
export function useSnapshotSelector(date, snapshot) {
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

export async function useOnBudgetSave(title: string) {
    const api = new Api
    await api.createBudget(title)

    const result = oBudgets.value

    result.push({
        budget_id: 0,
        title: title,
        date_created: null,
        date_modified: null
    })

    console.log('useOnBudgetSave')
}