<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
// import { budgetsInit, useSnapshotSelector, snapshot, oBudgets } from '../composables/budget'
// import { BudgetApi } from '../api/budget'
import { useBudgetStore, type Budget } from '../stores/budget'
import { useToast } from 'primevue/usetoast'

const store = useBudgetStore()

const toast = useToast();

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
    const api = new BudgetApi
    const { ok, budget, message } = await api.createBudget(budgetTitle.value)

    if (ok) {
        const budgets = oBudgets.value

        budgets.push({
            budget_id: budget.budget_id,
            title: budgetTitle.value,
            date_created: null,
            date_modified: null
        })
    } else {
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 });
    }

    budgetDialog.value = false
}

const date = ref(new Date())

const dt = ref(null)
const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)
const budgetDialog = ref(false)
const budgetTitle = ref()

const budget = reactive<Budget>({
    budget_id: 0,
    title: ''
})

const edit = (budg: Budget) => {
    const oBudget = {...budg}
    budget.budget_id = oBudget.budget_id
    budget.title = oBudget.title
    budgetDialog.value = true;
}

async function handleSave() {
    console.log('handleSave()')

    let result

    if (budget.budget_id) {
        result = await store.updateBudget(budget)
    } else {
        result = await store.createBudget(budget)
    }

    if (!result) {
        showToast(result, 'An error has occured')
    }

    budgetDialog.value = false
    budget.budget_id = 0
    budget.title = ''
}

onMounted(() => {
    store.snapshotSelector(date)
})
</script>

<template>

    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New budget envelope" icon="pi pi-plus" class="mr-2" severity="success" @click="budgetDialog = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="store.snapshot">
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            &nbsp;
                            <Calendar v-model="date" dateFormat="MM yy" showButtonBar view="month" :manualInput="false" :maxDate="maxDate" showIcon />
                        </div>
                    </template>
                    <Column field="title" header="Envelope">
                        <template #body="slotProps">
                            <a href="#" @click="edit(slotProps.data)">{{ slotProps.data.title }}</a>
                        </template>
                    </Column>
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

    <template>
        <div class="card flex flex-wrap gap-3 p-fluid">
            <Dialog v-model:visible="budgetDialog" modal header="Budget Envelope" :style="{ width: '25rem' }">
                <div class="flex align-items-center gap-3 mb-5">
                    <InputText placeholder="Name of your budget envelope" v-model="budget.title" class="w-full" />
                </div>
                <div class="flex justify-content-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="budgetDialog = false"></Button>
                    <Button type="button" label="Save" @click="handleSave"></Button>
                </div>
            </Dialog>
        </div>
    </template>

</template>