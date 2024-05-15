<script setup lang="ts">
import { ref, onMounted, isProxy, toRaw } from 'vue';
import BaseLayout from '../BaseLayout.vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Calendar from 'primevue/calendar'
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
  const oDate = new Date(date.value);
  const oMonth = oDate.getMonth() + 1
  
  const budget_month = oMonth + '-' + oDate.getFullYear()

  const budgets = budget_dates.value

  if (isProxy(budgets)) {
    const raw = toRaw(budgets)

    // console.log(raw)

    raw.forEach(data => {
      if (data.month == budget_month) {
        console.log(data.budgets)
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

async function fetchSnapshots(budget_month: string) {
  const api = new Api

  if (budget_month) {
    snapshots.value = await api.getSnapshotsBy(budget_month)
  } else {
    snapshots.value = await api.getSnapshots()
  }
}

async function buildBudgetSnapshots() {
  const api = new Api

  const budgets = await api.getBudgets()
  const snapshots = await api.getSnapshots()
  
  const dates = ['1-2024','2-2024','3-2024','4-2024','5-2024','6-2024','7-2024']

  // Fetch all transaction endings for each budget
  const endings = {}
  snapshots.forEach(data => {
      endings[data.title] = {
          title: data.title,
          budget_month: data.budget_month,
          assigned: data.assigned,
          available: data.available
      }
  });

  // Build the budget snapshots data structure
  const data = []
  dates.forEach(month => {
      let oMonths = { month: month, budgets: [] = [] }
      
      budgets.forEach(budget => {
          let oBudgets = {}
          oBudgets.title = budget.title

          let snaps = {}
          let hasSnapshot = false

          snapshots.forEach(snapshot => {
              if (budget.budget_id == snapshot.budget_id && month == snapshot.budget_month) {
                oBudgets.assigned = snapshot.assigned
                oBudgets.available = snapshot.available
                hasSnapshot = true
                  // snaps = {
                  //     assigned: snapshot.assigned,
                  //     available: snapshot.available
                  // }
              }
          })
          
          if (!hasSnapshot) {
              if (endings[budget.title]) {
                  const oEnding = endings[budget.title]

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
  // console.log(budget_dates.value)
}

const severity = (value) => {
  let severity: string = ''

  if (value > 0) {
    severity = 'success'
  } else if (value < 0) {
    severity = 'danger'
  } else {
    severity = 'warning'
  }

  return severity
}

onMounted(() => {
  buildBudgetSnapshots()
  getSnapshots()
});

const snapshots = ref(null)
const text = ref()
const count = ref(0)
const date = ref(new Date())

const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)
const budget_dates = ref(null)

const formatCurrency = (value) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })
}
</script>

<template>

<BaseLayout>
  <template #header>
      <div class="card">
          <Toolbar style="padding: .5rem">
              <template #center>
                <Calendar v-model="date" dateFormat="MM yy" showButtonBar view="month" :maxDate="maxDate" @date-select="getSnapshots" showIcon />
              </template>
          </Toolbar>
      </div>
  </template>

  <template #default>
    <div class="card">
      <DataTable stripedRows :value="snapshots" scrollable scrollHeight="300px" :virtualScrollerOptions="{ itemSize: 46 }" selectionMode="single">
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
  </template>

</BaseLayout>

</template>
