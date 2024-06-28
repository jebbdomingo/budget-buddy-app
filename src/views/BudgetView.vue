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
                    <Column :exportable="false" style="min-width:8rem" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                        <template #body="slotProps">
                            <SplitButton
                                label="Edit" icon="pi pi-check" menuButtonIcon="pi pi-cog" @click="edit(slotProps.data)" severity="secondary"
                                :model="[
                                    {
                                        label: 'Archive',
                                        icon: 'pi pi-trash',
                                        command: () => {
                                            confirmArchive(slotProps.data)
                                        }
                                    }
                                ]"
                            />
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

            <Dialog v-model:visible="archiveDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
                <div class="confirmation-content">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span v-if="budget">Are you sure you want to archive <b>{{ budget.title }}</b>?</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" text @click="archiveDialog = false"/>
                    <Button label="Yes" icon="pi pi-check" text @click="handleArchive" />
                </template>
            </Dialog>
        </div>
    </template>

</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useBudgetStore } from '../stores/budget'
import { type Budget } from '../types/types'
import { useToast } from 'primevue/usetoast'

const store = useBudgetStore()
const toast = useToast();
const date = ref(new Date())
const dt = ref(null)
const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)
const budgetDialog = ref(false)
const archiveDialog = ref(false)

const budget = reactive<Budget>({
    budget_id: 0,
    title: ''
})

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

const showToast = (result: boolean, message: string) => {
    if (!result) {
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 })
    } else {
        toast.add({ severity: 'success', summary: 'Operation successful', detail: message, life: 3000 })
    }
}

const edit = (budg: Budget) => {
    const oBudget = {...budg}
    budget.budget_id = oBudget.budget_id
    budget.title = oBudget.title
    budgetDialog.value = true
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

const confirmArchive = (budg: Budget) => {
    const oBudget = {...budg}
    budget.budget_id = oBudget.budget_id
    budget.title = oBudget.title
    archiveDialog.value = true
}

const handleArchive = async () => {
    const result = await store.archiveBudget(budget)

    archiveDialog.value = false
    
    if (result) {
        showToast(true, budget.title + ' has been archived')
    } else {
        showToast(false, 'Unable to archive ' + budget.title)
    }

    // Reset account
    budget.budget_id = 0
    budget.title = ''
}

onMounted(() => {
    store.snapshotSelector(date)
})
</script>