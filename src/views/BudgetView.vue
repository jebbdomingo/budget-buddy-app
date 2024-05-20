<script setup lang="ts">
import { ref, onMounted, isProxy, toRaw } from 'vue';
import BaseLayout from '../BaseLayout.vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag'
import { Api } from '../api'

const toast = useToast()

const increaseCount = () => {
  count.value++
  
  if (count.value === 3) {
    toast.add({severity:'success', summary: 'PrimeVue', detail:'Welcome to PrimeVue + Create Vue', life: 3000})
    
    count.value = 0
  }
}

const getSnapshots = () => {
  const oDate = new Date(date.value)
  const oMonth = oDate.getMonth() + 1
  
  const budget_month = oMonth + '-' + oDate.getFullYear()

  const budgets = budget_dates.value

  if (isProxy(budgets)) {
    const raw = toRaw(budgets)

    raw.forEach(data => {
      if (data.month == budget_month) {
        // console.log(data.budgets)
        snapshots.value = data.budgets
      }
    })
  }
}

// const getSnapshots = () => {
//   const oDate = new Date(date.value);
//   const oMonth = oDate.getMonth() + 1
  
//   const budget_month = oMonth + '-' + oDate.getFullYear()
//   // const budget_month = '4-2024'
  
//   fetchSnapshots(budget_month)
// }

// async function fetchSnapshots(budget_month: string) {
//   const api = new Api

//   if (budget_month) {
//     snapshots.value = await api.getSnapshotsBy(budget_month)
//   } else {
//     snapshots.value = await api.getSnapshots()
//   }
// }

async function buildBudgetSnapshots() {
  const api = new Api

  const budgets = await api.getBudgets()
  const balances = await api.getBudgetsBalances()
  
  const dates = ['1-2024','2-2024','3-2024','4-2024','5-2024','6-2024','7-2024']

  // Build the budgets balances data structure
  const data = []
  const lastBudgetMonth = {}

  dates.forEach(month => {
      let oMonths = { month: month, budgets: [] = [] }
      
      budgets.forEach(budget => {
          let oBudgets = {}
          oBudgets.title = budget.title
          let hasBudgetBalance = false

          balances.forEach(budgetBalance => {
              if (budget.budget_id == budgetBalance.budget_id && month == budgetBalance.budget_month) {
                oBudgets.assigned = budgetBalance.assigned
                oBudgets.available = budgetBalance.available

                hasBudgetBalance = true

                lastBudgetMonth[budgetBalance.budget_id] = {
                  budget_id: budgetBalance.budget_id,
                  budget_month: budgetBalance.budget_month,
                  assigned: budgetBalance.assigned,
                  available: budgetBalance.available
                }
              }
          })

          if (!hasBudgetBalance) {
              if (lastBudgetMonth[budget.budget_id]) {
                const oEnding = lastBudgetMonth[budget.budget_id]
                oEnding.title = budget.title

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

  budget_dates.value = data

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
const text = ref()
const count = ref(0)
const date = ref(new Date())

const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)
const budget_dates = ref(null)
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

<BaseLayout>
  <template #header>
      <div class="card">
          <Toolbar style="padding: .5rem">
            <template #start>
              <Button icon="pi pi-plus" class="mr-2" severity="secondary" @click="transactionModalVisible = true" />
            </template>

              <template #center>
                <Calendar v-model="date" dateFormat="MM yy" showButtonBar view="month" :maxDate="maxDate" @date-select="getSnapshots" showIcon />
              </template>
          </Toolbar>
      </div>
  </template>

  <template #default>
    <div class="card">
      <DataTable stripedRows :value="snapshots" scrollable scrollHeight="380px" :virtualScrollerOptions="{ itemSize: 46 }" selectionMode="single">
          <Column field="title"></Column>
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

</BaseLayout>

</template>
