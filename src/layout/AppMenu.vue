<script setup>
import { ref, onMounted } from 'vue';
import { Api } from '../api'
import AppMenuItem from './AppMenuItem.vue';

import { state } from '@/stores/state'
const { newTransaction } = state()

async function fetchBudgets() {
    const api = new Api
    budgets.value = await api.getBudgets()
}

async function fetchAccounts() {
    const api = new Api
    accounts.value = await api.getAccounts()
}

async function saveTransaction() {
    const oDate = new Date(transactionDate.value);
    const oMonth = oDate.getMonth() + 1
    const budget_month = oMonth + '-' + oDate.getFullYear()

    const api = new Api
    await api.createTransaction(selectedBudget.value.budget_id, selectedAccount.value.account_id, amount.value, budget_month)

    transactionModalVisible.value = false

    newTransaction({
        budget_id: selectedBudget.value.budget_id,
        budget_month: budget_month,
        amount: amount.value
    })
}

onMounted(() => {
    fetchBudgets()
    fetchAccounts()
})

const model = ref([
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Accounts', icon: 'pi pi-fw pi-dollar', to: '/accounts' },
            { label: 'Transaction', icon: 'pi pi-fw pi-plus-circle', command: () => {
                transactionModalVisible.value = true
            } }
        ]
    }
])

const transactionModalVisible = ref(false)
const selectedBudget = ref()
const selectedAccount = ref()
const payee = ref()
const amount = ref()
const budgets = ref()
const accounts = ref()
const transactionDate = ref(new Date())
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>

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
                    <InputText placeholder="Payee" v-model="payee" class="w-full md:w-14rem" />
                </div>
                <div class="flex align-items-center gap-3 mb-5">
                    <Dropdown v-model="selectedBudget" :options="budgets" filter optionLabel="title" placeholder="Budget" class="w-full md:w-14rem" @select="fetchBudgets"></Dropdown>
                </div>
                <div class="flex align-items-center gap-3 mb-5">
                    <Dropdown v-model="selectedAccount" :options="accounts" filter optionLabel="title" placeholder="Account" class="w-full md:w-14rem" @select="fetchAccounts"></Dropdown>
                </div>
                <div class="flex align-items-center gap-3 mb-5">
                    <Calendar v-model="transactionDate" showButtonBar showIcon class="w-full md:w-14rem" />
                </div>
                <div class="flex justify-content-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="transactionModalVisible = false"></Button>
                    <Button type="button" label="Save" @click="saveTransaction"></Button>
                </div>
            </Dialog>
        </div>
    </template>
</template>

<style lang="scss" scoped></style>
