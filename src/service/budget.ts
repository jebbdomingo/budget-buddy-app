import { toValue, ref, watch } from 'vue'
import { BudgetApi } from '../api/budget'

export class BudgetService {
    private api = new BudgetApi()

    async getBudgets() {
        let result = await this.api.getBudgets()

        if (result) {
            localStorage.setItem('budgets', JSON.stringify(toValue(result)))
        } else {
            result = localStorage.getItem('budgets')
        }

        return result
    }
}