<script setup lang="ts">
import { ref, onMounted, isProxy, toRaw, watch } from 'vue';
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { Api } from '../api'

import { state } from '@/stores/state'
const { isNewTransaction } = state()

watch(isNewTransaction, (txn) => {
    if (txn) {
        recalculateBudgetSnapshots(txn)
    }
})

const toast = useToast()

/**
 * Dynamically re-calculate all the budget snapshots for presentation
 */
const recalculateBudgetSnapshots = async (txn: {}) => {
    const result = fetchSnapshots()

    if (result) {
        result.forEach(row => {
            const snapshot = {
                budget_id: txn.budget_id,
                title: null,
                assigned: 0,
                available: 0
            }
            
            if (row.month == txn.budget_month) {
                row.budgets.forEach((budget, index) => {
                    if (budget.budget_id == txn.budget_id) {
                        snapshot.title = budget.title
                        snapshot.assigned = budget.assigned + txn.amount
                        snapshot.available = budget.available + txn.amount
                        row.budgets[index] = snapshot
                    }
                })
            } else if (row.month > txn.budget_month) {
                row.budgets.forEach((budget, index) => {
                    if (budget.budget_id == txn.budget_id) {
                        snapshot.title = budget.title
                        snapshot.assigned = budget.assigned
                        snapshot.available = budget.available + txn.amount
                        row.budgets[index] = snapshot
                    }
                })
            }
        })
    }
}

const fetchSnapshots = () => {
    return budgetSnapshots.value
}

const getSnapshots = () => {
    const oDate = new Date(date.value)
    const month = oDate.getMonth() + 1

    const budgetMonth = month + '-' + oDate.getFullYear()

    let snaps: []
    if (snaps = fetchSnapshots()) {
        snaps.forEach(data => {
            if (data.month == budgetMonth) {
                snapshots.value = data.budgets
            }
        });
    }
}

/**
 * Build budgets balances data structure for app presentation
 */
async function buildBudgetSnapshots() {
    const api = new Api
    const balances = await api.getBudgetsBalances()

    const oDate = new Date(date.value)
    const month = oDate.getMonth() + 1
    const year = oDate.getFullYear()

    const dates: [string] = []

    for (let i = 1; i <= (month + 2); i++) {
        dates.push(i + '-' + year)
    }

    const data: any = []
    const lastRunningBalance = {}

    dates.forEach(month => {
        let oMonths = { month: month, budgets: [] = [] }
        
        budgets.value.forEach(budget => {
            let oBudgets = {}
            oBudgets.budget_id = budget.budget_id
            oBudgets.title = budget.title

            let hasBudgetBalance = false

            balances.forEach(budgetBalance => {
                if (budget.budget_id == budgetBalance.budget_id && month == budgetBalance.budget_month) {
                    oBudgets.assigned = budgetBalance.assigned
                    oBudgets.available = budgetBalance.available

                    hasBudgetBalance = true

                    // Use to track the last known balance of a budget
                    lastRunningBalance[budgetBalance.budget_id] = {
                        budget_id: budgetBalance.budget_id,
                        title: budget.title,
                        budget_month: budgetBalance.budget_month,
                        assigned: budgetBalance.assigned,
                        available: budgetBalance.available
                    }
                }
            })

            if (!hasBudgetBalance) {
                if (lastRunningBalance[budget.budget_id]) {
                    const oEnding = lastRunningBalance[budget.budget_id]

                    if (oEnding.budget_month != month) {
                        oEnding.assigned = 0
                    }

                    oBudgets = oEnding
                } else {
                    oBudgets.assigned = 0
                    oBudgets.available = 0
                }
            }

            oMonths.budgets.push(oBudgets)
        })
        
        data.push(oMonths)
    })

    budgetSnapshots.value = data

    getSnapshots()
}

const severity = (value) => {
    let severity: string = ''

    if (value > 0) {
        severity = 'success'
    } else if (value < 0) {
        severity = 'danger'
    } else {
        severity = 'secondary'
    }

    return severity
}

const formatCurrency = (value: any) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })
}

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
    buildBudgetSnapshots()
}

onMounted(() => {
    fetchBudgets()
    fetchAccounts()
    buildBudgetSnapshots()
})

const snapshots = ref(null)
const count = ref(0)
const date = ref(new Date())

const dt = ref(null);
const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)
const budgetSnapshots = ref(null)
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

    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New budget" icon="pi pi-plus" class="mr-2" severity="success" @click="transactionModalVisible = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="snapshots">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Budgets</h5>
                            <Calendar v-model="date" dateFormat="MM yy" showButtonBar view="month" :maxDate="maxDate" @date-select="getSnapshots" showIcon />
                        </div>
                    </template>
                    <Column field="title" header="Category"></Column>
                    <Column field="assigned" header="Assigned" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                    <template #body="slotProps">
                        {{ formatCurrency(slotProps.data.assigned) }}
                    </template>
                    </Column>
                    <Column field="available" header="Available" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                    <template #body="slotProps">
                        <Tag :value="formatCurrency(slotProps.data.available)" :severity="severity(slotProps.data.available)"></Tag>
                    </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <!-- <div class="greetings">
        <Button @click="increaseCount" label="Count"></Button>
        <h5 class="green">{{ count }}</h5>

        <FloatLabel>
        <InputText id="txt" v-model="text" />
        <label for="txt">Text label</label>
        </FloatLabel>
    </div> -->

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