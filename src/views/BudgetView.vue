<script setup lang="ts">
import { ref, onMounted, isProxy, toRaw, toValue, watch } from 'vue';
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { Api } from '../api'
import { useSnapshotGenerator, useRecalculateSnapshots, useSnapshotSelector, useOnBudgetSave } from '../service/budget'

import { state } from '@/stores/state'
const { isNewTransaction } = state()

watch(isNewTransaction, (transaction) => {
    if (transaction) {
        useRecalculateSnapshots(transaction)
    }
})

const toast = useToast()

/**
 * Dynamically re-calculate all the budget snapshots for presentation
 */
// const useRecalculateBudgetSnapshots = async (txn: {}) => {
//     const result = fetchSnapshots()

//     if (result) {
//         result.forEach(row => {
//             const snapshot = {
//                 budget_id: txn.budget_id,
//                 title: null,
//                 assigned: 0,
//                 available: 0
//             }
            
//             if (row.month == txn.budget_month) {
//                 row.budgets.forEach((budget, index) => {
//                     if (budget.budget_id == txn.budget_id) {
//                         snapshot.title = budget.title
//                         snapshot.assigned = budget.assigned + txn.amount
//                         snapshot.available = budget.available + txn.amount
//                         row.budgets[index] = snapshot
//                     }
//                 })
//             } else if (row.month > txn.budget_month) {
//                 row.budgets.forEach((budget, index) => {
//                     if (budget.budget_id == txn.budget_id) {
//                         snapshot.title = budget.title
//                         snapshot.assigned = budget.assigned
//                         snapshot.available = budget.available + txn.amount
//                         row.budgets[index] = snapshot
//                     }
//                 })
//             }
//         })
//     }
// }

// const fetchSnapshots = () => {
//     return budgetSnapshots.value
// }

// const getSnapshots = () => {
//     const oDate = new Date(date.value)
//     const month = oDate.getMonth() + 1

//     const budgetMonth = month + '-' + oDate.getFullYear()

//     let snaps: []
//     if (snaps = fetchSnapshots()) {
//         snaps.forEach(data => {
//             if (data.month == budgetMonth) {
//                 snapshots.value = data.budgets
//             }
//         });
//     }
// }

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

async function saveBudget() {
    useOnBudgetSave(budgetTitle.value)
    newBudgetModalVisible.value = false
}

async function generateSnapshots() {
    useSnapshotGenerator(date)
    useSnapshotSelector(date, snapshot)
}

onMounted(() => {
    generateSnapshots()
})

const snapshot = ref(null)
const date = ref(new Date())

const dt = ref(null);
const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)
const newBudgetModalVisible = ref(false)
const budgetTitle = ref()
</script>

<template>

    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New budget envelope" icon="pi pi-plus" class="mr-2" severity="success" @click="newBudgetModalVisible = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="snapshot">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            &nbsp;
                            <Calendar v-model="date" dateFormat="MM yy" showButtonBar view="month" :manualInput="false" :maxDate="maxDate" showIcon />
                        </div>
                    </template>
                    <Column field="title" header="Envelope"></Column>
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
            <Dialog v-model:visible="newBudgetModalVisible" modal header="Budget Envelope" :style="{ width: '25rem' }">
                <div class="flex align-items-center gap-3 mb-5">
                    <InputText placeholder="Name of your budget envelope" v-model="budgetTitle" class="w-full" />
                </div>
                <div class="flex justify-content-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="newBudgetModalVisible = false"></Button>
                    <Button type="button" label="Save" @click="saveBudget"></Button>
                </div>
            </Dialog>
        </div>
    </template>

</template>