<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { Api } from '../api'
import { useToast } from 'primevue/usetoast'
import { accountsInit, accounts, Account } from '../composables/accounts'

onMounted(() => {
    accountsInit()
})

const toast = useToast();
const dt = ref(null)
const accountModalVisible = ref<boolean>(false)
const archiveAccountDialog = ref(false)
const account = reactive<Account>({
    account_id: 0,
    title: '',
    balance: 0
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
        toast.add({ severity: 'warn', summary: 'Operation failed', detail: message, life: 3000 });
    }
}

async function saveAccount() {
    console.log('saveAccount()')

    const api = new Api

    if (account.account_id) {
        const { ok, result, message } = await api.updateAccount(account.account_id, account.title)

        accounts.value.forEach((acct: Account, index: number) => {
            if (acct.account_id == account.account_id) {
                acct.title = account.title
                accounts[index] = acct
            }
        })

        showToast(ok, message)
    } else {
        const { ok, result, message } = await api.createAccount(account.title)

        if (ok) {
            accounts.value.push({
                account_id: result.account_id,
                title: account.title,
                balance: 0
            })
        }

        showToast(ok, message)
    }

    accountModalVisible.value = false
    account.account_id = 0
    account.title = ''
}

const editAccount = (acct: Account) => {
    const oAccount = {...acct}
    account.account_id = oAccount.account_id
    account.title = oAccount.title
    accountModalVisible.value = true;
}

const confirmDeleteTransaction = (prod) => {
    product.value = prod;
    archiveAccountDialog.value = true;
}

const archiveAccount = () => {
    products.value = products.value.filter(val => val.id !== product.value.id);
    archiveAccountDialog.value = false;
    product.value = {};
    toast.add({severity:'success', summary: 'Successful', detail: 'Product Deleted', life: 3000});
}
</script>

<template>

    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="Add Account" icon="pi pi-plus" class="mr-2" severity="success" @click="accountModalVisible = true" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable ref="dt" stripedRows :value="accounts">
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
                            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteTransaction(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <template>
        <div class="card flex flex-wrap gap-3 p-fluid">
            <Dialog v-model:visible="accountModalVisible" modal header="Account" :style="{ width: '25rem' }">
                <div class="flex align-items-center gap-3 mb-5">
                    <InputText placeholder="Give it a nickname" v-model="account.title" class="w-full" />
                </div>
                <div class="flex justify-content-end gap-2">
                    <Button type="button" label="Cancel" severity="secondary" @click="accountModalVisible = false"></Button>
                    <Button type="button" label="Save" @click="saveAccount"></Button>
                </div>
            </Dialog>

            <Dialog v-model:visible="archiveAccountDialog" :style="{width: '450px'}" header="Confirm" :modal="true">
                <div class="confirmation-content">
                    <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                    <span v-if="product">Are you sure you want to delete <b>{{product.name}}</b>?</span>
                </div>
                <template #footer>
                    <Button label="No" icon="pi pi-times" text @click="archiveAccountDialog = false"/>
                    <Button label="Yes" icon="pi pi-check" text @click="archiveAccount" />
                </template>
            </Dialog>
        </div>
    </template>

</template>