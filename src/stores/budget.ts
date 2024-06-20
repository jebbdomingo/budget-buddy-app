import { ref, watch, watchEffect, toValue } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { transactionInit } from '@/composables/transaction'

export interface Budget {
	budget_id: number
	title: string
}

export interface BudgetBalance {
	budget_id: number
	budget_month: string
    amount: number
}

export interface BudgetTransaction {
	budget_id: number
	budget_month: string
    title: string
	amount: number
}

const api = new BudgetApi

export const useBudgetStore = defineStore('budget', () => {
    const budgets = ref<Budget[]>([])
    const balances = ref([])
    const snapshots = ref(null)
    const snapshot = ref(null)

    async function initialize() {
        const budgetRes = await api.getBudgets()
        const balanceRes = await api.getBudgetsBalances()

        setBudgets(budgetRes)
        setBalances(balanceRes)

        const generate = () => {
            console.log('useBudgetStore::initialize::generate()')
    
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
                let months = { month: month, budgets: [] = [] }
                
                const result = toValue(budgets)
                result.forEach(budget => {
                    let cBudget: Budget = <Budget>{} // Temporary budget container
                    cBudget.budget_id = budget.budget_id
                    cBudget.title = budget.title
    
                    let hasBudgetBalance = false
    
                    // Search for the transaction balances (assigned and available balance) for the corresponding budget
                    balances.value.forEach(budgetBalance => {
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
                            const ending = lastRunningBalance[budget.budget_id]
    
                            if (ending.budget_month != month) {
                                ending.assigned = 0
                            }
    
                            cBudget = ending
                        } else {
                            cBudget.assigned = 0
                            cBudget.available = 0
                        }
                    }
    
                    // Populate all the budgets with assigned and available funds per month
                    months.budgets.push(cBudget)
                })
                
                data.push(months)
            })
    
            snapshots.value = data
        }
        
        watch(snapshots, (newValue) => {
            console.log('watch:snapshots')
            localStorage.setItem('snapshots', JSON.stringify(toValue(newValue)))
        }, { deep: true })
    
        if (!toValue(snapshots)) {
            generate()
        }
    }

    function setBudgets(data) {
        if (data.error) {
            // Fetch from local storage when offline
            budgets.value = JSON.parse(localStorage.getItem('budgets'))
        } else {
            budgets.value = data

            // Cache budgets
            localStorage.setItem('budgets', JSON.stringify(toValue(budgets)))
        }
    }
    
    function setBalances(data) {
        if (data.error) {
            // Fetch from local storage when offline
            balances.value = JSON.parse(localStorage.getItem('budgets-balances'))
        } else {
            balances.value = data

            // Cache budgets
            localStorage.setItem('budgets-balances', JSON.stringify(toValue(budgets)))
        }
    }

    async function archiveBudget(budget: Budget) {
        const { ok } = await api.archiveBudget(budget.budget_id)

        if (ok) {
            const result = budgets.value.filter(val => val.budget_id !== budget.budget_id)
            setBudgets(result)
        }

        return ok
    }

    async function updateBudget(budget: Budget) {
        const { ok } = await api.updateBudget(budget.budget_id, budget.title)

        const index = findIndexById(toValue(budgets), budget.budget_id)
        
        if (index) {
            // Update reactive budgets
            budgets.value[index].title = budget.title

            // Update reactive snapshots
            recalculateSnapshots({ budget_id: budget.budget_id, title: budget.title })
        }

        return ok
    }
    
    async function createBudget(budg: Budget) {
        const { ok, budget } = await api.createBudget(budg.title)

        if (ok) {
            budgets.value.push({
                budget_id: budget.budget_id,
                title: budg.title,
                date_created: null,
                date_modified: null
            })

            recalculateSnapshots({ budget_id: budget.budget_id, title: budget.title })
        }

        return ok
    }

    /**
     * Dynamically re-calculate all the budget snapshots for presentation
     * There are two (2) reasons to update the snapshots
     *  1. Change of budget's title
     *  2. Budget allocation (i.e. assigned and available balance)
     * 
     * @param transaction   New transaction
     */
    async function recalculateSnapshots(transaction: BudgetTransaction) {
        snapshots.value.forEach(row => {
            if (transaction.amount) {
                runningBalance(row, transaction)
            } else if (transaction.title) {
                changeBudgetTitle(row, transaction)
            }
        })
    }

    /**
     * Calculate running balance on each snapshot
     * 
     * @param row 
     * @param transaction 
     */
    const runningBalance = (row, transaction: BudgetTransaction) => {
        const snapshot = {
            budget_id: transaction.budget_id,
            title: '',
            assigned: 0,
            available: 0
        }

        if (row.month == transaction.budget_month) {
            row.budgets.forEach((budget, index) => {
                if (budget.budget_id == transaction.budget_id) {
                    snapshot.title = transaction.title ? transaction.title : budget.title
                    snapshot.assigned = budget.assigned + transaction.amount
                    snapshot.available = budget.available + transaction.amount
                    row.budgets[index] = snapshot
                }
            })
        } else if (row.month > transaction.budget_month) {
            row.budgets.forEach((budget, index) => {
                if (budget.budget_id == transaction.budget_id) {
                    snapshot.title = transaction.title ? transaction.title : budget.title
                    snapshot.assigned = budget.assigned
                    snapshot.available = budget.available + transaction.amount
                    row.budgets[index] = snapshot
                }
            })
        }
    }

    /**
     * Update budget title on each snapshot
     * 
     * @param row 
     * @param transaction 
     */
    const changeBudgetTitle =(row, transaction: BudgetTransaction) => {
        const snapshot = {
            budget_id: transaction.budget_id,
            title: transaction.title,
            assigned: 0,
            available: 0
        }

        const index = findIndexById(row.budgets, transaction.budget_id)
        
        if (index != -1) {
            console.log('edit existing budget')
            const budget = row.budgets[index]
            snapshot.assigned = budget.assigned
            snapshot.available = budget.available
            row.budgets[index] = snapshot
        } else {
            console.log('add new budget')
            row.budgets.push(snapshot)
        }
    }

    const findIndexById = (data, id) => {
        let index = -1

        for (let i = 0; i < data.length; i++) {
            if (data[i].budget_id === id) {
                index = i
                break
            }
        }

        return index
    }

    /**
     * Snapshot selector
     * 
     * @param date 
     */
    function snapshotSelector(date) {
        const selectSnapshot = () => {
            const oDate = new Date(toValue(date))
            const month = oDate.getMonth() + 1
            const year = oDate.getFullYear()
            const budgetMonth = month + '-' + year
        
            let result: []
            result = toValue(snapshots)
            if (result) {
                result.forEach(row => {
                    if (row.month == budgetMonth) {
                        snapshot.value = row.budgets
                    }
                });
            }
        }

        watchEffect(() => {
            console.log('selectSnapshot()')
            selectSnapshot()
        })
    }

    watch(budgets, (newValue) => {
        // Store updated budgets in local storage
        console.log('store.budget::watch')
        localStorage.setItem('budgets', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    return { budgets, snapshots, snapshot, initialize, setBudgets, updateBudget, createBudget, archiveBudget, recalculateSnapshots, snapshotSelector }
})
