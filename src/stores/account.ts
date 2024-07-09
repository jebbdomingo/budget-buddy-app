import { ref, watch, reactive, computed, toValue } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { type Account } from '../types/types'
import { useTransactionStore } from './transaction'

const api = new BudgetApi

export const useAccountStore = defineStore('account', () => {
    const accounts = ref<Account[]>([])

    async function initialize() {
        const res = await api.getAccountBalances()
        setAccounts(res)
    }

    function setAccounts(data) {
        if (data.error) {
            // Fetch from local storage when offline
            accounts.value = JSON.parse(localStorage.getItem('accounts'))
        } else {
            accounts.value = data

            // Cache accounts
            localStorage.setItem('accounts', JSON.stringify(toValue(accounts)))
        }
    }

    async function archiveAccount(account: Account) {
        const { ok } = await api.archiveAccount(account.account_id)

        if (ok) {
            const result = accounts.value.filter(val => val.account_id !== account.account_id)
            setAccounts(result)
        }

        return ok
    }

    async function updateAccount(account: Account) {
        const { ok } = await api.updateAccount(account.account_id, account.title)

        if (ok) {
            accounts.value.forEach((acct: Account, index: number) => {
                if (acct.account_id == account.account_id) {
                    acct.title = account.title
                    accounts[index] = acct
                }
            })
        }

        return ok
    }
    
    async function createAccount(acct: Account) {
        const { ok, account } = await api.createAccount(acct.title)

        if (ok) {
            accounts.value.push({
                account_id: account.account_id,
                title: account.title,
                balance: 0
            })
        }

        return ok
    }

    function recalculateAccounts() {
        const calculate = {
            '+': function(a: number, b: number) { return a + b },
            '-': function(a: number, b: number) { return a - b }
        }

        const transactionStore = useTransactionStore()
        let totals = {}

        accounts.value.forEach(row => {
            transactionStore.transactions.forEach(txn => {
                const operator = txn.transaction_type == 'Inflow' ? '+' : '-'

                if (row.account_id == txn.account_id) {
                    const bal = parseFloat(totals[row.account_id]) ? parseFloat(totals[row.account_id]) : 0
                    const amount = Math.abs(txn.amount)
                    const avail = calculate[operator](bal, amount)
                    totals[txn.account_id] = avail
                }
            })

            row.balance = totals[row.account_id]
        })
    }

    watch(accounts, (newValue) => {
        // Store updated accounts in local storage
        console.log('account-store.watch:accounts')
        localStorage.setItem('accounts', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    return { accounts, initialize, setAccounts, updateAccount, createAccount, archiveAccount, recalculateAccounts }
})
