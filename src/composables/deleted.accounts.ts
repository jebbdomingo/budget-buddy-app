import { toValue, ref, watch } from 'vue'
import { AccountService } from '../service/deleted.account'

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
    const accountService = new AccountService

    accounts.value = await accountService.getAccounts()

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