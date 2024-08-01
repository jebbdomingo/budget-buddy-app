<template>

    <div class="grid">
        <div class="col-12" style="padding: 0;">
            <div class="card" style="padding: 1rem;">
                <Toolbar>
                    <template v-slot:start>
                        <div>
                            <Button label="New budget envelope" icon="pi pi-plus" class="mr-2" severity="success" @click="budgetDialog = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="store.snapshot">
                    <template #header>
                        <div class="flex flex-wrap align-items-center justify-content-between gap-2">
                            <Calendar v-model="date" dateFormat="MM yy" showButtonBar view="month" :manualInput="false" :maxDate="maxDate" showIcon touchUI style="width: 12rem;" />
                            <span class="text-xl text-900 font-bold">
                                <InlineMessage :severity="severity(store.readyToAssign)">
                                    <div><b>{{ formatCurrency(store.readyToAssign) }}</b></div>
                                    <div v-if="store.readyToAssign">Ready to Assign</div>
                                    <div v-if="!store.readyToAssign">All Money Assigned</div>
                                </InlineMessage>
                            </span>
                        </div>
                    </template>
                    <Column field="title" header="Envelope">
                        <template #body="slotProps">
                            <a @click="budgetSettings(slotProps.data)">{{ slotProps.data.title }}</a>
                        </template>
                    </Column>
                    <Column field="assigned" header="Assigned" headerStyle="width: 9rem; text-align: right" bodyStyle="text-align: right">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.assigned) }}
                        </template>
                    </Column>
                    <Column field="available" header="Available" headerStyle="width: 9rem; text-align: right" bodyStyle="text-align: right">
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

            <Dialog v-model:visible="assignDialog" modal header="Assign a Budget" :style="{ width: '25rem' }">
                <div class="flex align-items-center gap-3 mb-5">
                    <InputGroup>
                        <InputGroupAddon>₱</InputGroupAddon>
                        <InputNumber placeholder="Amount" v-model="allocation.assigned" inputId="minmaxfraction" :minFractionDigits="2" :maxFractionDigits="5" />
                    </InputGroup>
                </div>
                <div class="flex align-items-center gap-3 mb-5">
                    <FloatLabel class="w-full md:w-14rem">
                        <Dropdown inputId="budget-from" v-model="allocation.from" :options="store.budgets" filter optionLabel="title" optionValue="budget_id" placeholder="FROM:" class="w-full"></Dropdown>
                        <label for="budget-from">From</label>
                    </FloatLabel>
                </div>
                <div class="flex align-items-center gap-3 mb-5">
                    <FloatLabel class="w-full md:w-14rem">
                        <Dropdown inputId="budget-to" v-model="allocation.to" :options="store.budgets" filter optionLabel="title" optionValue="budget_id" placeholder="TO:" class="w-full"></Dropdown>
                        <label for="budget-to">To</label>
                    </FloatLabel>
                </div>
                <div class="flex justify-content-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="assignDialog = false"></Button>
                    <Button type="button" label="Save" @click="handleAssign"></Button>
                </div>
            </Dialog>
        </div>
    </template>

    <template>
        <Dialog v-model:visible="activitiesDialog" modal header="Transactions" :style="{ width: '35rem' }">
            <div class="grid">
                <div class="col-12">
                    <div class="card">
                        <DataTable stateStorage="session" stateKey="dt-state-account-transactions-session" ref="dt" stripedRows :value="budgetTransactions" rowGroupMode="subheader" groupRowsBy="transaction_date" :rowClass="rowClass">
                            <Column field="transaction_date" header="Date"></Column>
                            <Column field="payee">
                                <template #body="slotProps">
                                    <div>{{ slotProps.data.payee }}</div>
                                    <div><small>{{ slotProps.data.budget_title }}</small></div>
                                </template>
                            </Column>
                            <Column field="amount" headerStyle="width: 9rem; text-align: right" bodyStyle="text-align: right">
                                <template #body="slotProps">
                                    <div :class="transactionColor(slotProps.data.amount)">{{ formatCurrency(slotProps.data.amount) }}</div>
                                    <div><small>{{ slotProps.data.memo }}</small></div>
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width:8rem" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                                <template #body="slotProps">
                                    <SplitButton
                                        label="Edit" icon="pi pi-check" menuButtonIcon="pi pi-cog" @click="editTransaction(slotProps.data)" severity="secondary"
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
                            <template #groupheader="slotProps">
                                <div class="flex align-items-center gap-2 text-secondary">
                                    <span><strong>{{ formatDate(slotProps.data.transaction_date) }}</strong></span>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </Dialog>
        
        <Dialog v-model:visible="allocationsDialog" modal header="Moves" :style="{ width: '35rem' }">
            <div class="grid">
                <div class="col-12">
                    <div class="card">
                        <DataTable stateStorage="session" stateKey="dt-state-account-transactions-session" ref="dt" stripedRows :value="budgetAllocations" rowGroupMode="subheader" groupRowsBy="transaction_date" :rowClass="rowClass">
                            <Column field="transaction_date" header="Date"></Column>
                            <Column field="budget_credited"></Column>
                            <Column :exportable="false" style="min-width:2rem" bodyStyle="text-align: center">
                                <template #body="slotProps">
                                    <i class="pi pi-arrow-right"></i>
                                </template>
                            </Column>
                            <Column field="budget_debited"></Column>
                            <Column field="amount" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                                <template #body="slotProps">
                                    <div>{{ formatAllocationAmount(slotProps.data) }}</div>
                                </template>
                            </Column>
                            <template #groupheader="slotProps">
                                <div class="flex align-items-center gap-2 text-secondary">
                                    <span><strong>{{ formatDate(slotProps.data.transaction_date) }}</strong></span>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="budgetSettingsDialog" modal :header="selectedBudgetTitle" :style="{ width: '50vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
            <Menu :model="budgetSettingsItems" />
        </Dialog>
    </template>

</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, onMounted, reactive, watchEffect } from 'vue';
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useBudgetStore } from '../stores/budget'
import { useTransactionStore } from '../stores/transaction'
import { type Budget } from '../types/types'
import { useToast } from 'primevue/usetoast'
import { useRoute } from 'vue-router'

const route = useRoute()
const store = useBudgetStore()
const transactionStore = useTransactionStore()
const toast = useToast();
const date = ref(new Date())
const month = ref()
const dt = ref(null)
const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)
const selectedBudgetTitle = ref()
const budgetSettingsItems = ref()
const budgetDialog = ref(false)
const assignDialog = ref(false)
const movesDialog = ref(false)
const archiveDialog = ref(false)
const activitiesDialog = ref(false)
const allocationsDialog = ref(false)
const budgetSettingsDialog = ref(false)
const budgetAllocations = ref()
const activeBudget = ref()
const budgetTransactions = ref()

const allocationInitialState = {
    from: 0,
    to: 0,
    assigned: 0
}
const allocation = reactive(allocationInitialState)

const budget = reactive<Budget>({
    budget_id: 0,
    title: ''
})

const severity = (value) => {
    let severity: string = ''

    
    if (value > 0) {
        severity = 'success'
    } else if (value < 0) {
        severity = 'error'
    } else {
        severity = 'secondary'
    }

    return severity
}

const rowClass = (data) => {
    return [{ 'bg-blue-50': data.transaction_id }];
}

const transactionColor = (value) => {
    let className: string = ''

    if (value > 0) {
        className = 'text-primary-600'
    } else {
        className = 'text-secondary'
    }

    return className
}

const formatAllocationAmount = (data) => {
    const isDebit = data.budget_debited_id == activeBudget.value ? true : false
    const amount = isDebit ? data.debit : -data.debit
    
    return formatCurrency(amount)
}

const formatCurrency = (value: any) => {
    let result: number = value ? value : 0
    return result.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })
}

const formatDate = (value: string) => {
    const date = new Date(value)
    const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    return formatter.format(date)
    // return date.toLocaleDateString()
}

const showToast = (result: boolean, message: string) => {
    if (!result) {
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 })
    } else {
        toast.add({ severity: 'success', summary: 'Operation successful', detail: message, life: 3000 })
    }
}

const budgetSettings = (data: any) => {
    selectedBudgetTitle.value = data.title

    budgetSettingsItems.value = [
        {
            label: 'Assign',
            icon: 'pi pi-wallet',
            command: () => {
                assign(data)
            }
        },
        {
            label: 'Assigned for ' + month.value,
            icon: 'pi pi-dollar',
            command: () => {
                allocations(data.budget_id)
            }
        },
        {
            label: 'Activities in ' + month.value,
            icon: 'pi pi-credit-card',
            command: () => {
                activities(data.budget_id)
            }
        },
        {
            label: 'Rename Envelope',
            icon: 'pi pi-pen-to-square',
            command: () => {
                edit(data)
            }
        },
        {
            label: 'Archive',
            icon: 'pi pi-trash',
            command: () => {
                confirmArchive(data)
            }
        }
    ]

    budgetSettingsDialog.value = true
}

const allocations = (id: number) => {
    const oDate = new Date(date.value)
    const oMonth = oDate.getMonth() + 1
    const month = oMonth + '-' + oDate.getFullYear()

    activeBudget.value = id
    budgetAllocations.value = store.getBudgetAllocations(id, month)

    allocationsDialog.value = true
}

const activities = (id: number) => {
    const oDate = new Date(date.value)
    const oMonth = oDate.getMonth() + 1
    const month = oMonth + '-' + oDate.getFullYear()

    budgetTransactions.value = transactionStore.getBudgetTransactions(id, month)

    activitiesDialog.value = true
}

const edit = (budg: Budget) => {
    const oBudget = {...budg}
    budget.budget_id = oBudget.budget_id
    budget.title = oBudget.title
    budgetDialog.value = true
}

const editTransaction = (txn: Transaction) => {
    const oTxn = {...txn}

    transactionStore.transaction.transaction_id = oTxn.transaction_id
    transactionStore.transaction.budget = oTxn.budget
    transactionStore.transaction.budget_id = oTxn.budget_id
    transactionStore.transaction.account_id = oTxn.account_id
    transactionStore.transaction.transaction_type = oTxn.transaction_type
    transactionStore.transaction.transaction_date = oTxn.transaction_date
    transactionStore.transaction.amount = Math.abs(oTxn.amount) // Ensure absolute number
    transactionStore.transaction.budget_month = oTxn.budget_month
    transactionStore.transaction.payee = oTxn.payee
    transactionStore.transaction.memo = oTxn.memo

    transactionStore.transactionDialog = true;
}

const assign = (budg: Budget) => {
    const oBudget = {...budg}

    allocation.from = 1
    allocation.to = oBudget.budget_id

    assignDialog.value = true
}

async function handleAssign() {
    console.log('handleAssign()')

    // Set the transaction date based on the date selector
    const today = new Date()
    const oDate = date.value
    oDate.setDate(today.getDate()) // The date selector is formatted as MM yy, hence we need to explicitly set the current date of month for the transaction date

    await store.assign({
        from: allocation.from,
        to: allocation.to,
        assigned: allocation.assigned,
        transaction_date: oDate
    })

    // Reset
    Object.assign(allocation, allocationInitialState)

    assignDialog.value = false
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

watchEffect(() => {
    // Month
    month.value = date.value.toLocaleString('default', { month: 'long' })
})

onMounted(() => {
    store.snapshotSelector(date)
    transactionStore.initialize()
})
</script>