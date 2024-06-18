import { toValue, ref, watch } from 'vue'
import { BudgetApi } from '../api/budget'

export class AccountService {
    private api = new BudgetApi()

    getAccounts(callback) {
        const res = this.api.getAccountBalances()
        res.then((res) => callback(res))
    }
}