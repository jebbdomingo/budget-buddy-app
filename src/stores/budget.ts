import { ref, watch, watchEffect, toValue } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { type Budget, type BudgetTransaction } from '../types/types'
import { useTransactionStore } from './transaction'

const api = new BudgetApi
let o: SnapshotsOperation = <SnapshotsOperation>{}

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

        o = new SnapshotsOperation({
            budgets: budgets,
            balances: balances,
            snapshots: snapshots
        })
    
        if (!toValue(snapshots)) {
            o.generate()
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
            localStorage.setItem('budgets-balances', JSON.stringify(toValue(balances)))
        }
    }

    async function archiveBudget(budget: Budget) {
        console.log('budget-store.archive-budget')

        const { ok } = await api.archiveBudget(budget.budget_id)

        if (ok) {
            const result = budgets.value.filter(val => val.budget_id !== budget.budget_id)
            setBudgets(result)

            regenerateSnapshots('remove', { budget_id: budget.budget_id })
        }

        return ok
    }

    async function updateBudget(budget: Budget) {
        console.log('budget-store.update-budget')

        const { ok } = await api.updateBudget(budget.budget_id, budget.title)

        const index = findIndexById(toValue(budgets), budget.budget_id)
        
        if (index) {
            // Update reactive budgets
            budgets.value[index].title = budget.title

            // Update reactive snapshots
            regenerateSnapshots('update', { budget_id: budget.budget_id, title: budget.title })
        }

        return ok
    }
    
    async function createBudget(budg: Budget) {
        console.log('budget-store.create-budget')

        const { ok, budget } = await api.createBudget(budg.title)

        if (ok) {
            budgets.value.push({
                budget_id: budget.budget_id,
                title: budg.title,
                date_created: null,
                date_modified: null
            })

            // Add new budget in the reactive snapshots
            regenerateSnapshots('update', { budget_id: budget.budget_id, title: budget.title })
        }

        return ok
    }

    /**
     * Dynamically re-calculate all the budget snapshots for presentation
     * There are three (3) reasons for snapshots to change
     *  1. update - Change of budget's title
     *  2. allocation - Budget allocation (i.e. assigned and available balance)
     *  3. remove - Budget archiving
     * 
     * @param type Type of transaction [allocation, update, remove]
     * @param transaction New transaction
     * @param transaction Old transaction
     */
    async function regenerateSnapshots(type: string, transaction: BudgetTransaction, oldTransaction?: BudgetTransaction) {
        console.log('budget-store.regenerate-snapshots')
        o.regenerate(type, transaction, oldTransaction)
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
            console.log('budget-store.select-snapshot')
            selectSnapshot()
        })
    }

    watch(budgets, (newValue) => {
        // Store updated budgets in local storage
        console.log('budget-store.watch:budgets')
        localStorage.setItem('budgets', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    watch(snapshots, (newValue) => {
        // Store updated snapshots in local storage
        console.log('budget-store.watch:snapshots')
        localStorage.setItem('snapshots', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    return { budgets, snapshots, snapshot, initialize, setBudgets, updateBudget, createBudget, archiveBudget, regenerateSnapshots, snapshotSelector }
})

/**
 * Snapshots Utility Class
 */
class SnapshotsOperation {
    snapshots: any
    budgets: any
    balances: any
    transactionStore: any

    constructor(options: {budgets, balances, snapshots}) {
        this.budgets = options.budgets
        this.balances = options.balances
        this.snapshots = options.snapshots
        this.transactionStore = useTransactionStore()
    }

    generate() {
        console.log('budget-store.snapshot-operation.generate')

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
            
            const result = toValue(this.budgets)
            result.forEach(budget => {
                let cBudget: Budget = <Budget>{} // Temporary budget container
                cBudget.budget_id = budget.budget_id
                cBudget.title = budget.title

                let hasBudgetBalance = false

                // Search for the transaction balances (assigned and available balance) for the corresponding budget
                this.balances.value.forEach(budgetBalance => {
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

        this.snapshots.value = data
    }

    /**
     * Regnerate the snapshots based on the type of transactions
     * 
     * @param type [allocation, update, remove]
     * @param transaction BudgetTransaction
     */
    regenerate(type: string, transaction: BudgetTransaction, oldTransaction?) {
        if (type == 'allocation') {
            this.runningBalance(this.snapshots.value, transaction, oldTransaction)
        }

        this.snapshots.value.forEach(row => {
            switch(type) {
                case 'update': {
                    this.changeBudgetTitle(row, transaction)
                    break
                }
                case 'remove': {
                    this.removeBudget(row, transaction)
                    break
                }
            }
        })
    }

    findIndexById(data, id) {
        let index = -1

        for (let i = 0; i < data.length; i++) {
            if (data[i].budget_id === id) {
                index = i
                break
            }
        }

        return index
    }

    private calculate = {
        '+': function(a: number, b: number) { return a + b },
        '-': function(a: number, b: number) { return a - b }
    }

    cumulative(month: string, budget_id: number) {
        let result = 0

        this.transactionStore.transactions.forEach(txn => {
            if (budget_id == txn.budget_id && month == txn.budget_month) {
                const amount = Math.abs(txn.amount)
                const operator = txn.transaction_type == 'Inflow' ? '+' : '-'
                result = this.calculate[operator](result, amount)
            }
        })

        return result
    }
    
    /**
     * Calculate running balance on each snapshot
     * 
     * @param snapshots
     * @param transaction { budget_id, budget_month, transaction_type, amount }
     * @param oldTransaction { budget_id, budget_month, transaction_type, amount }
     */
    runningBalance(snapshots, transaction: BudgetTransaction, oldTransaction: BudgetTransaction) {
        console.log('budget-store.snapshot-operation.running-balance')

        const data: any = []
        let available = {}
        
        snapshots.forEach(row => {
            let months = { month: row.month, budgets: [] = [] }
            
            row.budgets.forEach((budget: Budget, index: number) => {
                let cBudget: Budget = <Budget>{} // Temporary budget container
                cBudget.budget_id = budget.budget_id
                cBudget.title = budget.title

                const ava = parseFloat(available[budget.title]) ? parseFloat(available[budget.title]) : 0

                const avail = ava + this.cumulative(row.month, cBudget.budget_id)
                available[budget.title] = avail

                console.log(ava, avail, cBudget.title)


                cBudget.assigned = budget.assigned
                cBudget.available = avail

                months.budgets.push(cBudget)
            })

            // console.log(available)

            data.push(months)



            // } else {
                // console.log('RECALCULATE SNAPSHOTS')
                // // Recalculation of assigned and running balance from the specified month to the set future months
                // if (row.month == transaction.budget_month) {
                //     row.budgets.forEach((budget, index) => {
                //         if (budget.budget_id == transaction.budget_id) {
                //             snapshot.title = budget.title
                //             snapshot.assigned = this.calculate[operator](budget.assigned, transaction.amount)
                //             snapshot.available = this.calculate[operator](budget.available, transaction.amount)
                //             row.budgets[index] = snapshot
                //         }
                //     })
                // } else if (row.month > transaction.budget_month) {
                //     row.budgets.forEach((budget, index) => {
                //         if (budget.budget_id == transaction.budget_id) {
                //             snapshot.title = budget.title
                //             snapshot.assigned = budget.assigned
                //             snapshot.available = this.calculate[operator](budget.available, transaction.amount)
                //             row.budgets[index] = snapshot
                //         }
                //     })
                // }
            // }
        })

        this.snapshots.value = data
    }

    /**
     * Update budget title on each snapshot
     * 
     * @param row 
     * @param transaction { budget_id, title }
     */
    changeBudgetTitle(row, transaction: BudgetTransaction) {
        const snapshot = {
            budget_id: transaction.budget_id,
            title: transaction.title,
            assigned: 0,
            available: 0
        }

        const index = this.findIndexById(row.budgets, transaction.budget_id)
        
        if (index != -1) {
            console.log('budget-store.snapshot-operation.edit-budget')
            const budget = row.budgets[index]
            snapshot.assigned = budget.assigned
            snapshot.available = budget.available
            row.budgets[index] = snapshot
        } else {
            console.log('budget-store.snapshot-operation.new-budget')
            row.budgets.push(snapshot)
        }
    }
    
    /**
     * Remove a budget on each snapshot
     * 
     * @param row 
     * @param transaction { budget_id }
     */
    removeBudget(row, transaction: BudgetTransaction) {
        console.log('budget-store.snapshot-operation.remove-budget')

        const result = row.budgets.filter(val => val.budget_id !== transaction.budget_id)
        
        row.budgets = result
    }
}