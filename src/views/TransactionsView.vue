<template>

    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="Accounts" icon="pi pi-angle-left" class="mr-2" severity="secondary" @click="back()" />
                            <Button label="Transaction" icon="pi pi-plus" class="mr-2" severity="primary" @click="transactionModalVisible = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="transactions">
                    <Column field="title"></Column>
                    <Column field="debit" header="Amount" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                    <template #body="slotProps">
                        <Tag :value="formatCurrency(slotProps.data.debit)" :severity="severity(slotProps.data.debit)"></Tag>
                    </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <TransactionView />

</template>

<script setup lang="ts">
import { ref, onMounted, toValue } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { BudgetApi } from '../api/budget'
import { useToast } from 'primevue/usetoast'
import { accountsInit, accounts } from '../composables/deleted.accounts'
import TransactionView from './TransactionView.vue'
import { transactionModalVisible } from '../stores/state'
import type { Transaction } from '@/composables/transaction'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const dt = ref(null)
const transactions: Transaction[] = ref<Transaction[]>()

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

function back() {
    router.go(-1)
}

onMounted(async() => {
    console.log(route.params.account_id)

    const account_id = route.params.account_id
    const api = new BudgetApi

    const storageName = 'AccountTransactions:' + account_id

    transactions.value = JSON.parse(localStorage.getItem(storageName)) || null

    console.log(toValue(transactions))
    if (!toValue(transactions)) {
        transactions.value = await api.getTransactionsByType('account', route.params.account_id)
        localStorage.setItem(storageName, JSON.stringify(toValue(transactions)))
    }

    // watch(transactions.value, (newValue) => {
    //     console.log('TransactionsView::watch:accounts')
    //     localStorage.setItem(storageName, JSON.stringify(toValue(newValue)))
    // })
})
</script>