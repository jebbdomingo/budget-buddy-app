import { ref, watch, toValue, reactive } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { type Transaction } from '../types/types'

const api = new BudgetApi
const account_id = ref(0)

const getLocalStorageName = () => {
    return 'account-transactions:' + account_id.value
}

const setTransactionType = (row: Transaction) => {
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
    
    return row
}

export const useTransactionStore = defineStore('transaction', () => {
    const transactions = ref<Transaction[]>([])

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

    async function initialize(id: any) {
        account_id.value = id
        const res = await api.getTransactionsByType('account', account_id.value)
        setTransactions(res)
    }

    function setTransactions(data) {
        if (data.error) {
            // Fetch from local storage when offline
            transactions.value = JSON.parse(localStorage.getItem(getLocalStorageName()))
        } else {
            transactions.value = data.map(setTransactionType)

            // Cache transactions
            localStorage.setItem(getLocalStorageName(), JSON.stringify(toValue(transactions)))
        }
    }

    async function archive(transaction: Account) {
        const { ok } = await api.archiveTransaction(transaction.transaction_id)

        if (ok) {
            const result = transactions.value.filter(val => val.transaction_id !== transaction.transaction_id)
            setTransactions(result)
        }

        return ok
    }

    async function update() {
        const { ok } = await api.updateTransaction(account.account_id, account.title)

        if (ok) {
            transactions.value.forEach((acct: Account, index: number) => {
                if (acct.account_id == account.account_id) {
                    acct.title = account.title
                    accounts[index] = acct
                }
            })
        }

        reset()

        return ok
    }
    
    async function create() {
        const { ok, result } = await api.createTransaction(transaction)

        if (ok) {
            transactions.value.push(setTransactionType(result))
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
        localStorage.setItem(getLocalStorageName(), JSON.stringify(toValue(newValue)))
    }, { deep: true })

    return { transaction, transactions, initialize, setTransactions, update, create, archive, reset }
})