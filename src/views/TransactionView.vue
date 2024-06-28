<template>
    <div class="card flex flex-wrap gap-3 p-fluid">
        <Dialog v-model:visible="transactionDialog" modal header="Add Transaction" :style="{ width: '25rem' }">
            <div class="flex align-items-center gap-3 mb-5">
                <InputGroup>
                    <InputGroupAddon>₱</InputGroupAddon>
                    <InputNumber placeholder="Amount" v-model="transactionStore.transaction.amount" inputId="minmaxfraction" :minFractionDigits="2" :maxFractionDigits="5" />
                    <InputGroupAddon>
                        <SelectButton v-model="transactionStore.transaction.transaction_type" :options="transactionTypes" aria-labelledby="basic" :allow-empty="false" />
                    </InputGroupAddon>
                </InputGroup>
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <InputText placeholder="Payee" v-model="transactionStore.transaction.payee" class="w-full" />
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <Dropdown v-model="transactionStore.transaction.budget_id" :options="budgetStore.budgets" filter optionLabel="title" optionValue="budget_id" placeholder="Budget" class="w-full"></Dropdown>
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <Dropdown v-model="transactionStore.transaction.account_id" :options="accountStore.accounts" filter optionLabel="title" optionValue="account_id" placeholder="Account" class="w-full"></Dropdown>
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <Calendar v-model="transactionStore.transaction.transaction_date" showButtonBar showIcon class="w-full" :manualInput="false" />
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <InputText placeholder="Enter a memo..." v-model="transactionStore.transaction.memo" class="w-full" />
            </div>
            <div class="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="transactionDialog = false"></Button>
                <Button type="button" label="Save" @click="handleSave"></Button>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast'
import { transactionDialog } from '../stores/state'
import { useBudgetStore } from '../stores/budget'
import { useAccountStore } from '../stores/account'
import { useTransactionStore } from '../stores/transaction'
import { type Account, type Budget } from '../types/types'

const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const transactionStore = useTransactionStore()

const toast = useToast();
const transactionTypes = ref(['Outflow', 'Inflow'])
const selectedBudget = ref(7)
const selectedAccount = ref<Account>()

const showToast = (result: boolean, message: string) => {
    if (!result) {
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 })
    } else {
        toast.add({ severity: 'success', summary: 'Operation successful', detail: message, life: 3000 })
    }
}

async function handleSave() {
    const oDate = new Date()
    const oMonth = oDate.getMonth() + 1
    
    transactionStore.transaction.budget_month = oMonth + '-' + oDate.getFullYear()
    
    let result

    if (transactionStore.transaction.transaction_id) {
        result = await transactionStore.update()
    } else {
        result = await transactionStore.create()
    }

    if (!result) {
        showToast(result, 'An error has occured')
    }

    transactionDialog.value = false

    budgetStore.regenerateSnapshots('allocation', {
        budget_id: transactionStore.transaction.budget_id,
        budget_month: transactionStore.transaction.budget_month,
        transaction_type: transactionStore.transaction.transaction_type,
        amount: transactionStore.transaction.amount
    })

    accountStore.recalculateAccounts({
        transaction_type: transactionStore.transaction.transaction_type,
        account_id: transactionStore.transaction.account_id,
        amount: transactionStore.transaction.amount
    })

    // Reset reactives
    transactionStore.reset()
}
</script>