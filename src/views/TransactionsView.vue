<template>

    <div class="grid">
        <div class="col-12" style="padding: 0;">
            <div class="card" style="padding: 1rem;">
                <Toolbar>
                    <template v-slot:start>
                        <div>
                            <Button label="Accounts" icon="pi pi-angle-left" class="mr-2" severity="secondary" @click="back()" />
                            <Button label="Transaction" icon="pi pi-plus" class="mr-2" severity="primary" @click="store.transactionDialog = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable stateStorage="session" stateKey="dt-state-account-transactions-session" ref="dt" stripedRows :value="accountTransactions" rowGroupMode="subheader" groupRowsBy="transaction_date" :rowClass="rowClass" sortField="transaction_date" :sortOrder="-1">
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
                                label="Edit" icon="pi pi-check" menuButtonIcon="pi pi-cog" @click="edit(slotProps.data)" severity="secondary"
                                :model="[
                                    {
                                        label: 'Archive',
                                        icon: 'pi pi-trash',
                                        command: () => {
                                            // confirmArchive(slotProps.data)
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

    <TransactionView />

</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import TransactionView from './TransactionView.vue'
import { useTransactionStore } from '../stores/transaction'
import { type Transaction } from '../types/types'

const route = useRoute()
const router = useRouter()
const dt = ref(null)
const store = useTransactionStore()
const accountTransactions = ref()

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

const formatCurrency = (value: any) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })
}

const formatDate = (value: string) => {
    const date = new Date(value)
    const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    return formatter.format(date)
    // return date.toLocaleDateString()
}

function back() {
    router.go(-1)
}

const edit = (txn: Transaction) => {
    const oTxn = {...txn}

    store.transaction.transaction_id = oTxn.transaction_id
    store.transaction.budget = oTxn.budget
    store.transaction.account_id = oTxn.account_id
    store.transaction.transaction_type = oTxn.transaction_type
    store.transaction.transaction_date = oTxn.transaction_date
    store.transaction.amount = Math.abs(oTxn.amount) // Ensure absolute number
    store.transaction.budget_month = oTxn.budget_month
    store.transaction.payee = oTxn.payee
    store.transaction.memo = oTxn.memo

    store.transactionDialog = true;
}

const transactions = (account_id: number) => {
    accountTransactions.value = store.getAccountTransactions(account_id)
}

watch(store.transactions, (newValue) => {
    // Store updated transactions in local storage
    transactions(route.params.account_id)
    console.log('TransactionsView.watch:transactions')
}, { deep: true })

onMounted(async() => {
    transactions(route.params.account_id)
})
</script>