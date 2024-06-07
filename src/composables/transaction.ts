import { toValue, ref, watch } from 'vue'
import { Api } from '../api'

export type Transaction = {
	account_id: number
	budget_id: number
	debit: number
	credit: number
}

export const transactions: Transaction[] = ref<Transaction[]>()

export async function transactionInit() {
    watch(transactions.value, (newValue) => {
        console.log('transactionsInit::watch:transactions')
        localStorage.setItem('Service:Transactions', JSON.stringify(toValue(newValue)))
    })
}