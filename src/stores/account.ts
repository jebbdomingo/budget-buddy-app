import { ref, watch, reactive, computed, toValue } from 'vue'
import { defineStore } from 'pinia'
import { BudgetApi } from '../api/budget'
import { type Account, type AccountTransaction } from '../types/types'

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

    async function recalculateAccounts(transaction: AccountTransaction) {
        const result = accounts.value

        const calculate = {
            '+': function(a: number, b: number) { return a + b },
            '-': function(a: number, b: number) { return a - b }
        }

        const operator = transaction.transaction_type == 'Inflow' ? '+' : '-'
    
        result.forEach(row => {
            if (row.account_id == transaction.account_id) {
                row.balance = calculate[operator](row.balance, transaction.amount)
            }
        })
    }

    watch(accounts, (newValue) => {
        // Store updated accounts in local storage
        console.log('account-store.watch:accounts')
        localStorage.setItem('accounts', JSON.stringify(toValue(newValue)))
    }, { deep: true })

    return { accounts, initialize, setAccounts, updateAccount, createAccount, archiveAccount, recalculateAccounts }
})
