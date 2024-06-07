import { toValue, ref, watch } from 'vue'
import { Api } from '../api'

export type Account = {
	account_id: number
	title: string
	balance: number
}

export type AccountTransaction = {
	account_id: number
	amount: number
}

export const accounts: Account[] = ref<Account[]>()

export async function accountsInit() {
    const api = new Api

    accounts.value = JSON.parse(localStorage.getItem('Service:Accounts')) || null

    if (!toValue(accounts)) {
        accounts.value = await api.getAccountBalances()
        localStorage.setItem('Service:Accounts', JSON.stringify(toValue(accounts)))
    }

    watch(accounts.value, (newValue) => {
        console.log('accountsInit::watch:accounts')
        localStorage.setItem('Service:Accounts', JSON.stringify(toValue(newValue)))
    })
}

/**
 * Dynamically re-calculate all accounts for presentation
 * 
 * @param transaction   New transaction
 */
export async function useRecalculateAccounts(transaction: AccountTransaction) {
    console.log('useRecalculateAccounts')
    const result = accounts.value

    result.forEach(row => {
        if (row.account_id == transaction.account_id) {
            row.balance += transaction.amount
        }
    })
}