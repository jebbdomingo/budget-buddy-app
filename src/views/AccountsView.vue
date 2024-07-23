<template>

    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="Add Account" icon="pi pi-plus" class="mr-2" severity="success" @click="editAccountDialog = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="store.accounts">
                    <Column field="title" header="Account">
                        <template #body="{data}">
                            
                            <router-link :to="{ name: 'transactions', params: { account_id: data.account_id }}">
                                {{data.title}}
                            </router-link>
                        </template>
                    </Column>
                    <Column field="balance" header="Balance" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                        <template #body="slotProps">
                            <Tag :value="formatCurrency(slotProps.data.balance)" :severity="severity(slotProps.data.balance)"></Tag>
                        </template>
                    </Column>
                    <Column :exportable="false" style="min-width:8rem" headerStyle="width: 7rem; text-align: right" bodyStyle="text-align: right">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editAccount(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmArchiveAccount(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <template>
        <div class="card flex flex-wrap gap-3 p-fluid">
            <Dialog v-model:visible="editAccountDialog" modal header="Account" :style="{ width: '25rem' }">
                <div class="flex align-items-center gap-3 mb-5">
                    <InputText placeholder="Give it a nickname" v-model="account.title" class="w-full" />
                </div>
                <div class="flex justify-content-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="editAccountDialog = false"></Button>
                    <Button type="button" label="Save" @click="handleSave"></Button>
                </div>
            </Dialog>

            <Dialog v-model:visible="archiveAccountDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
                <div class="confirmation-content">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span v-if="account">Are you sure you want to archive <b>{{ account.title }}</b>?</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" text @click="archiveAccountDialog = false"/>
                    <Button label="Yes" icon="pi pi-check" text @click="handleArchive" />
                </template>
            </Dialog>
        </div>
    </template>

</template>

<script setup lang="ts">
// @ts-nocheck

import { ref, reactive } from 'vue';
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useAccountStore } from '../stores/account'
import { type Account } from '../types/types'

const store = useAccountStore()

const toast = useToast()
const dt = ref(null)
const editAccountDialog = ref<boolean>(false)
const archiveAccountDialog = ref(false)
const account = reactive<Account>({
    account_id: 0,
    title: '',
    balance: 0
})

const severity = (value: number) => {
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
    value = value == null ? 0 : value
    return value.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })
}

const showToast = (result: boolean, message: string) => {
    if (!result) {
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 })
    } else {
        toast.add({ severity: 'success', summary: 'Operation successful', detail: message, life: 3000 })
    }
}

async function handleSave() {
    console.log('handleSave()')

    let result

    if (account.account_id) {
        result = await store.updateAccount(account)
    } else {
        result = await store.createAccount(account)
    }

    if (!result) {
        showToast(result, 'An error has occured')
    }

    editAccountDialog.value = false
    account.account_id = 0
    account.title = ''
}

const handleArchive = async () => {
    const result = await store.archiveAccount(account)

    archiveAccountDialog.value = false
    
    if (result) {
        showToast(true, account.title + ' has been archived')
    } else {
        showToast(false, 'Unable to archive ' + account.title)
    }

    // Reset account
    account.account_id = 0
    account.title = ''
    account.balance = 0
}

const editAccount = (acct: Account) => {
    const oAccount = {...acct}
    account.account_id = oAccount.account_id
    account.title = oAccount.title
    editAccountDialog.value = true;
}

const confirmArchiveAccount = (acct: Account) => {
    const oAccount = {...acct}
    account.account_id = oAccount.account_id
    account.title = oAccount.title
    archiveAccountDialog.value = true
}
</script>