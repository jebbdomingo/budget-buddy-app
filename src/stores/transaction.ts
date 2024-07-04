import { ref, watch, toValue, reactive } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { type Transaction } from '../types/types'
import { useAccountStore } from './account'

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

    const date = new Date(row.transaction_date)
    row.transaction_date = date.toLocaleDateString("en-US")
    
    return row
}

export const useTransactionStore = defineStore('transaction', () => {
    const transactions = ref<Transaction[]>([])
    const accountTransactions = ref<Transaction[]>([])

    const initialState = {
        transaction_id: 0,
        budget_id: 0,
        account_id: 0,
        transaction_type: 'Outflow',
        transaction_date: '',
        amount: 0,
        budget_month: '',
        payee: '',
        memo: ''
    }
    
    const transaction = reactive<Transaction>(initialState)
    const oldTransaction = {}

    async function initialize(id?: any) {
        if (typeof id !== 'undefined') {
            account_id.value = id
            const res = await api.getTransactionsByType('account', account_id.value)
            setAccountTransactions(res)
        }

        const res = await api.getTransactions()
        setTransactions(res)
    }

    function setAccountTransactions(data) {
        if (data.error) {
            // Fetch from local storage when offline
            accountTransactions.value = JSON.parse(localStorage.getItem(getLocalStorageName()))
        } else {
            accountTransactions.value = data.map(normalize)

            // Cache account's transactions
            localStorage.setItem(getLocalStorageName(), JSON.stringify(toValue(accountTransactions)))
        }
    }

    function setTransactions(data) {
        if (data.error) {
            // Fetch from local storage when offline
            transactions.value = JSON.parse(localStorage.getItem('transactions'))
        } else {
            transactions.value = data.map(normalize)

            // Cache budgets
            localStorage.setItem('transactions', JSON.stringify(toValue(transactions)))
        }
    }

    async function archive(transaction: Account) {
        const { ok } = await api.archiveTransaction(transaction.transaction_id)

        if (ok) {
            const result = transactions.value.filter(val => val.transaction_id !== transaction.transaction_id)
            setAccountTransactions(result)
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

            transactions.value.forEach((txn: Transaction, index: number) => {
                if (txn.transaction_id == transaction.transaction_id) {
                    txn.account_id = transaction.account_id
                    txn.budget_id = transaction.budget_id
                    txn.budget_month = transaction.budget_month
                    txn.amount = amount
                    txn.payee = transaction.payee
                    txn.memo = transaction.memo
                    txn.transaction_date = transaction.transaction_date
                    txn.transaction_type = transaction.transaction_type
                    transactions[index] = txn
                }
            })
            
            accountTransactions.value.forEach((txn: Transaction, index: number) => {
                if (txn.transaction_id == transaction.transaction_id) {
                    txn.account_id = transaction.account_id
                    txn.budget_id = transaction.budget_id
                    txn.budget_month = transaction.budget_month
                    txn.amount = amount
                    txn.payee = transaction.payee
                    txn.memo = transaction.memo
                    txn.transaction_date = transaction.transaction_date
                    txn.transaction_type = transaction.transaction_type
                    accountTransactions[index] = txn
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
            accountTransactions.value.push(txn)
        }

        reset()

        return ok
    }

    function reset() {
        Object.assign(transaction, initialState)
    }
    
    function setOldTransaction(txn) {
        Object.assign(oldTransaction, txn)

        console.log(oldTransaction)
    }

    async function recalculateAccount() {
        const calculate = {
            '+': function(a: number, b: number) { return a + b },
            '-': function(a: number, b: number) { return a - b }
        }

        const operator = transaction.transaction_type == 'Inflow' ? '+' : '-'

        let amount = 0

        transactions.value.forEach(row => {
            amount += row.amount
        })

        const store = useAccountStore()

        store.accounts.forEach(row => {
            if (row.account_id == account_id.value) {
                row.balance = amount
            }
        })
    
        // accounts.value.forEach(row => {
        //     if (row.account_id == transaction.account_id) {
        //         row.balance = calculate[operator](row.balance, transaction.amount)
        //     }
        // })
    }

    watch(accountTransactions, (newValue) => {
        // Store updated transactions in local storage
        console.log('transaction-store.watch:account-transactions')
        localStorage.setItem(getLocalStorageName(), JSON.stringify(toValue(newValue)))
    }, { deep: true })
    
    watch(transactions, (newValue) => {
        // Store updated transactions in local storage
        console.log('transaction-store.watch:transactions')
        localStorage.setItem('transactions', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    return { transaction, oldTransaction, setOldTransaction, accountTransactions, transactions, initialize, setAccountTransactions, update, create, archive, reset, recalculateAccount }
})