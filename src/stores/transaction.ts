// @ts-nocheck

import { ref, watch, toValue, reactive } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { type Budget, type Transaction } from '../types/types'
import { useBudgetStore } from './budget'

const api = new BudgetApi
const account_id = ref(0)

const getLocalStorageName = () => {
    return 'account-transactions:' + account_id.value
}

const normalize = (row: Transaction) => {
    let amount: number
    let type: string

    if (row.debit) {
        type = 'Inflow'
        amount = row.debit
    } else {
        amount = -row.credit
        type = 'Outflow'
    }

    row.amount = amount
    row.transaction_type = type
    delete row.debit
    delete row.credit

    // Transaction date
    const date = new Date(row.transaction_date)
    row.transaction_date = date.toLocaleDateString("en-US")

    // Budget object
    const budgetStore = useBudgetStore()
    row.budget = budgetStore.getBudget(row.budget_id)
    
    return row
}

export const useTransactionStore = defineStore('transaction', () => {
    const transactions = ref<Transaction[]>([])
    const transactionDialog = ref<boolean>(false)

    const initialState = {
        transaction_id: 0,
        budget: <Budget>{},
        account_id: 0,
        transaction_type: 'Outflow',
        transaction_date: '',
        amount: 0,
        budget_month: '',
        payee: '',
        memo: ''
    }
    
    const transaction = reactive<Transaction>(<Transaction>{ transaction_type: 'Outflow' })

    async function initialize() {
        const res = await api.getTransactions()
        setTransactions(res)
    }

    function setTransactions(data) {
        if (data.error) {
            // Fetch from local storage when offline
            transactions.value = JSON.parse(localStorage.getItem('transactions'))
        } else {
            transactions.value = data.map(normalize)

            // Cache transactions
            localStorage.setItem('transactions', JSON.stringify(toValue(transactions)))
        }
    }

    function getAccountTransactions(account_id: number) {
        let result: any = []

        transactions.value.forEach(transaction => {
            if (transaction.account_id == account_id) {
                result.push(transaction)
            }
        })

        return result
    }

    function getBudgetTransactions(id: any, month?: string) {
        let result: any = []

        transactions.value.forEach(transaction => {
            if (transaction.budget_id == id && transaction.budget_month == month) {
                result.push(transaction)
            }
        })

        return result
    }

    async function archive(transaction: Transaction) {
        const { ok } = await api.archiveTransaction(transaction.transaction_id)

        if (ok) {
            const result = transactions.value.filter(val => val.transaction_id !== transaction.transaction_id)
            setTransactions(result)
        }

        return ok
    }

    async function update() {
        const oDate = new Date(transaction.transaction_date)
        const oMonth = oDate.getMonth() + 1
    
        transaction.budget_month = oMonth + '-' + oDate.getFullYear()
        transaction.transaction_date = oDate.toLocaleDateString("en-US")

        const { ok } = await api.updateTransaction(transaction)

        if (ok) {
            const amount = transaction.transaction_type == 'Outflow' ? -transaction.amount : transaction.amount

            // @todo these could be implemented as an event behavior
            transactions.value.forEach((txn: Transaction, index: number) => {
                if (txn.transaction_id == transaction.transaction_id) {
                    txn.account_id = transaction.account_id
                    txn.budget = transaction.budget
                    txn.budget_month = transaction.budget_month
                    txn.amount = amount
                    txn.payee = transaction.payee
                    txn.memo = transaction.memo
                    txn.transaction_date = transaction.transaction_date
                    txn.transaction_type = transaction.transaction_type
                    transactions[index] = txn
                }
            })
        }

        reset()

        return ok
    }
    
    async function create() {
        const oDate = new Date(transaction.transaction_date)
        const oMonth = oDate.getMonth() + 1
    
        transaction.budget_month = oMonth + '-' + oDate.getFullYear()
        transaction.transaction_date = oDate.toLocaleDateString("en-US")

        const { ok, result } = await api.createTransaction(transaction)

        if (ok) {
            const txn = normalize(result)
            transactions.value.push(txn)
        }

        reset()

        return ok
    }

    function reset() {
        Object.assign(transaction, initialState)
    }
    
    watch(transactions, (newValue) => {
        // Store updated transactions in local storage
        console.log('transaction-store.watch:transactions')
        localStorage.setItem('transactions', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    return { transactionDialog, transaction, getAccountTransactions, getBudgetTransactions, transactions, initialize, update, create, archive, reset }
})