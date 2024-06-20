<template>
    <div class="card flex flex-wrap gap-3 p-fluid">
        <Dialog v-model:visible="transactionModalVisible" modal header="Add Transaction" :style="{ width: '25rem' }">
            <div class="flex align-items-center gap-3 mb-5">
                <InputGroup>
                    <InputGroupAddon>₱</InputGroupAddon>
                    <InputNumber placeholder="Amount" v-model="amount" inputId="minmaxfraction" :minFractionDigits="2" :maxFractionDigits="5" />
                </InputGroup>
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <InputText placeholder="Payee" v-model="payee" class="w-full" />
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <Dropdown v-model="selectedBudget" :options="budgetStore.budgets" filter optionLabel="title" placeholder="Budget" class="w-full"></Dropdown>
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <Dropdown v-model="selectedAccount" :options="accountStore.accounts" filter optionLabel="title" placeholder="Account" class="w-full"></Dropdown>
            </div>
            <div class="flex align-items-center gap-3 mb-5">
                <Calendar v-model="transactionDate" showButtonBar showIcon class="w-full" :manualInput="false" />
            </div>
            <div class="flex justify-content-end gap-2">
                <Button type="button" label="Cancel" severity="secondary" @click="transactionModalVisible = false"></Button>
                <Button type="button" label="Save" @click="handleSave"></Button>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BudgetApi } from '../api/budget'
import { useToast } from 'primevue/usetoast'
import { transactionModalVisible } from '../stores/state'
import { useBudgetStore } from '../stores/budget'
import { useAccountStore } from '../stores/account'

const accountStore = useAccountStore()
const budgetStore = useBudgetStore()

const toast = useToast();
const selectedBudget = ref()
const selectedAccount = ref()
const payee = ref()
const amount = ref()
const transactionDate = ref(new Date())

async function handleSave() {
    const oDate = new Date(transactionDate.value);
    const oMonth = oDate.getMonth() + 1
    const budget_month = oMonth + '-' + oDate.getFullYear()

    const api = new BudgetApi

    const { ok, message } =  await api.createTransaction(
        selectedBudget.value.budget_id,
        selectedAccount.value.account_id,
        amount.value,
        budget_month
    )

    if (!ok) {
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 });
    }

    transactionModalVisible.value = false

    budgetStore.regenerateSnapshots('allocation', {
        budget_id: selectedBudget.value.budget_id,
        budget_month: budget_month,
        amount: amount.value
    })

    accountStore.recalculateAccounts({
        account_id: selectedAccount.value.account_id,
        amount: amount.value
    })

    // Reset reactives
    selectedBudget.value = null
    selectedAccount.value = null
    amount.value = null
}
</script>