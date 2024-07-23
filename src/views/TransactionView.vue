<template>
    <div class="card flex flex-wrap gap-3 p-fluid">
        <Dialog v-model:visible="transactionStore.transactionDialog" modal header="Transaction" :style="{ width: '25rem' }">
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
                <Dropdown v-model="transactionStore.transaction.budget" :options="budgetStore.budgets" filter optionLabel="title" placeholder="Budget" class="w-full"></Dropdown>
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
                <Button type="button" label="Cancel" severity="secondary" @click="handleCancel"></Button>
                <Button type="button" label="Save" @click="handleSave"></Button>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
// @ts-nocheck

import { ref } from 'vue';
import { useToast } from 'primevue/usetoast'
import { useBudgetStore } from '../stores/budget'
import { useAccountStore } from '../stores/account'
import { useTransactionStore } from '../stores/transaction'

const accountStore = useAccountStore()
const budgetStore = useBudgetStore()
const transactionStore = useTransactionStore()

const toast = useToast();
const transactionTypes = ref(['Outflow', 'Inflow'])

const showToast = (result: boolean, message: string) => {
    if (!result) {
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 })
    } else {
        toast.add({ severity: 'success', summary: 'Operation successful', detail: message, life: 3000 })
    }
}

async function handleCancel() {
    // Reset transaction reactive
    transactionStore.reset()

    transactionStore.transactionDialog = false
}

async function handleSave() {
    let result

    if (transactionStore.transaction.transaction_id) {
        result = await transactionStore.update()
    } else {
        result = await transactionStore.create()
    }

    if (!result) {
        showToast(result, 'An error has occured')
    }

    transactionStore.transactionDialog = false

    budgetStore.regenerateSnapshots('running')
    accountStore.recalculateAccounts()

    // Reset transaction reactive
    transactionStore.reset()
}
</script>