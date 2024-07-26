// @ts-nocheck

import { ref, watch, watchEffect, toValue } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { type Budget, type BudgetTransaction, type Allocation } from '../types/types'
import { useTransactionStore } from './transaction'

const api = new BudgetApi
let o: SnapshotsOperation = <SnapshotsOperation>{}

export const useBudgetStore = defineStore('budget', () => {
    const budgets = ref<Budget[]>([])
    const balances = ref([])
    const allocations = ref<Allocation[]>([])
    const snapshots = ref(null)
    const snapshot = ref(null)
    const readyToAssign = ref(null) // Active ready-to-assign budget

    async function initialize() {
        console.log('budget-store.initialize')

        const budgetRes = await api.getBudgets()
        const balanceRes = await api.getBudgetsBalances()
        const allocationRes = await api.getAllocations()

        setBudgets(budgetRes)
        setBalances(balanceRes)
        setAllocations(allocationRes)

        o = new SnapshotsOperation({
            budgets: budgets,
            balances: balances,
            allocations: allocations,
            snapshots: snapshots
        })
    
        if (!toValue(snapshots)) {
            o.generate()
            o.runningBalance()
        }
    }

    function setBudgets(data) {
        if (data.error) {
            // Fetch from local storage when offline
            budgets.value = JSON.parse(localStorage.getItem('budgets'))
        } else {
            budgets.value = data

            // Cache budgets
            console.log('budget-store.setbBudgets')
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
    
    function setAllocations(data) {
        if (data.error) {
            // Fetch from local storage when offline
            allocations.value = JSON.parse(localStorage.getItem('allocations'))
        } else {
            allocations.value = data

            // Cache allocations
            localStorage.setItem('allocations', JSON.stringify(toValue(allocations)))
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

    async function assign(allocation) {
        console.log('budget-store.assign-budget')

        const oDate = new Date(allocation.transaction_date)
        const oMonth = oDate.getMonth() + 1
    
        allocation.month = oMonth + '-' + oDate.getFullYear()
        allocation.transaction_date = oDate.toLocaleDateString("en-US")

        const { ok } = await api.createAllocation(allocation)

        const from = getBudget(allocation.from)
        const to = getBudget(allocation.to)

        // Update allocations reactive
        allocations.value.push({
            budget_month: allocation.month,
            budget_credited_id: from.budget_id,
            budget_credited: from.title,
            budget_debited_id: to.budget_id,
            budget_debited: to.title,
            debit: allocation.assigned,
            credit: allocation.assigned,
            transaction_date: allocation.transaction_date
        })

        // Update reactive snapshots
        regenerateSnapshots('assign', allocation)

        return ok
    }
    
    async function updateBudget(budget: Budget) {
        console.log('budget-store.update-budget')

        const { ok } = await api.updateBudget(budget.budget_id, budget.title)

        const index = findIndexById(toValue(budgets), budget.budget_id)
        
        // Update reactive budgets
        budgets.value[index].title = budget.title

        // Update reactive snapshots
        regenerateSnapshots('update', { budget_id: budget.budget_id, title: budget.title })

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

    function getBudgetAllocations(id: any, date?: string) {
        let result: any = []

        allocations.value.forEach(allocation => {
            if (allocation.budget_month == date && (allocation.budget_debited_id == id || allocation.budget_credited_id == id)) {
                result.push(allocation)
            }
        })

        return result
    }

    function getBudget(id: number) {
        const index = findIndexById(budgets.value, id)
        return budgets.value[index]
    }

    /**
     * Dynamically re-calculate all the budget snapshots for presentation
     * There are three (3) reasons for snapshots to change
     *  1. update - Change of budget's title
     *  2. allocation - Budget allocation (i.e. assigned and available balance)
     *  3. remove - Budget archiving
     *  4. assign - Budget allocation
     * 
     * @param type Type of transaction [allocation, update, remove]
     */
    async function regenerateSnapshots(type: string, transaction?: any) {
        console.log('budget-store.regenerate-snapshots')
        o.regenerate(type, transaction)
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
            // Today's date
            const today = new Date()
            const current_month = today.getMonth() + 1
            const current_year = today.getFullYear()
            const current_budget_month = current_month + '-' + current_year

            // Date selector
            const oDate = new Date(toValue(date))
            const selected_month = oDate.getMonth() + 1
            const selected_year = oDate.getFullYear()
            const selected_budget_month = selected_month + '-' + selected_year
        
            let result: []
            result = toValue(snapshots)
            if (result) {
                result.forEach(row => {
                    if (row.month == selected_budget_month) {
                        snapshot.value = row.budgets
                    }
                });
            }
            
            // Set the active ready-to-assign value
            if (snapshot.value) {
                // Ready-to-assign is intended only for the current and future budget months
                readyToAssign.value = selected_budget_month >= current_budget_month ? snapshot.value[0].available : 0

                // Remove the Ready-to-assign budget envelope from the list of assignable budgets
                // Ready-to-assign is a special envelope for containing an inflow transaction
                // that will be assigned to differenct budget envelopes on a later date
                const result = snapshot.value.filter(val => val.budget_id !== 1)
                snapshot.value = result
            }
        }

        watchEffect(() => {
            console.log('budget-store.select-snapshot')
            selectSnapshot()
        })
    }

    watch(allocations, (newValue) => {
        // Store updated budgets in local storage
        console.log('budget-store.watch:allocations')
        localStorage.setItem('allocations', JSON.stringify(toValue(newValue)))
    }, { deep: true })
    
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

    return { budgets, snapshots, snapshot, readyToAssign, initialize, getBudget, setBudgets, assign, updateBudget, createBudget, archiveBudget, getBudgetAllocations, regenerateSnapshots, snapshotSelector }
})

/**
 * Snapshots Utility Class
 */
class SnapshotsOperation {
    snapshots: any
    budgets: any
    balances: any
    allocations: any
    transactionStore: any

    constructor(options: {budgets, balances, allocations, snapshots}) {
        this.budgets = options.budgets
        this.balances = options.balances
        this.allocations = options.allocations
        this.snapshots = options.snapshots
        this.transactionStore = useTransactionStore()
    }

    findAllocationBy(id, month) {
        let result: Allocation = <Allocation>{}
        const data = toValue(this.allocations)

        for (let i = 0; i < data.length; i++) {
            if (data[i].budget_id === id && data[i].budget_month == month) {
                result = data[i]
                break
            }
        }

        return result
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

        // Generate snapshots data structure
        dates.forEach(month => {
            let months = { month: month, budgets: [] = [] }
            
            this.budgets.value.forEach(budget => {
                let cBudget: Budget = <Budget>{}
                cBudget.budget_id = budget.budget_id
                cBudget.title = budget.title

                // Search for the transaction balances (assigned and available balance) for the corresponding budget
                this.balances.value.forEach(budgetBalance => {
                    if (budget.budget_id == budgetBalance.budget_id && month == budgetBalance.budget_month) {
                        cBudget.assigned = budgetBalance.assigned
                        cBudget.available = budgetBalance.available
                    }
                })
                
                months.budgets.push(cBudget)
            })
            
            data.push(months)
        })

        this.snapshots.value = data
    }

    /**
     * Regnerate the snapshots based on the type of transactions
     * 
     * @param type [allocation, assign, update, remove]
     * @param transaction
     */
    regenerate(type: string, transaction?: any) {
        if (type == 'running') {
            this.runningBalance()
        }
        
        if (type == 'assign') {
            this.assignBudget(transaction)
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

    /**
     * Get the transactions balance (inflow - outflow) for the given month and budget
     * 
     * @param month String
     * @param budget_id Number
     * @return total Number
     */
    getTransactionsBalance(month: string, budget_id: number) {
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
     * Assign a budget amount and calculate running balance on each snapshot
     */
    assignBudget(allocation) {
        console.log('budget-store.snapshot-operation.assign-budget')
        
        this.snapshots.value.forEach(row => {
            if (row.month == allocation.month) {
                // Debit target budget
                let dIndex = this.findIndexById(row.budgets, allocation.to)
                let dBudget = row.budgets[dIndex]
                dBudget.assigned += allocation.assigned
                dBudget.available += allocation.assigned
                row.budgets[dIndex] = dBudget

                // Credit source budget
                let cIndex = this.findIndexById(row.budgets, allocation.from)
                let cBudget = row.budgets[cIndex]
                cBudget.assigned -= allocation.assigned
                cBudget.available -= allocation.assigned
                row.budgets[cIndex] = cBudget
            }
        })

        this.runningBalance()
    }
    
    /**
     * Calculate running balance on each snapshot
     */
    runningBalance() {
        console.log('budget-store.snapshot-operation.running-balance')

        const data: any = []
        let available = {}
        
        this.snapshots.value.forEach(row => {
            let months = { month: row.month, budgets: [] = [] }
            
            row.budgets.forEach((budget: Budget) => {
                let cBudget: Budget = <Budget>{} // Temporary budget container
                cBudget.budget_id = budget.budget_id
                cBudget.title = budget.title

                const bal = parseFloat(available[budget.title]) ? parseFloat(available[budget.title]) : 0
                const assigned = parseFloat(budget.assigned) ? parseFloat(budget.assigned) : 0
                
                // Increment "available" fund from each previous month's balances
                const avail = bal + assigned + this.getTransactionsBalance(row.month, cBudget.budget_id)
                available[budget.title] = avail

                cBudget.assigned = assigned
                cBudget.available = avail

                months.budgets.push(cBudget)
            })

            data.push(months)
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