<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
  // const budget_month = '4-2024'
  
  fetchSnapshots(budget_month)
}

async function fetchSnapshots(budget_month: string) {
  const api = new Api

  if (budget_month) {
    snapshots.value = await api.getSnapshotsBy(budget_month)
  } else {
    snapshots.value = await api.getSnapshots()
  }
}

onMounted(() => {
  getSnapshots()
});

const snapshots = ref(null)
const text = ref()
const count = ref(0)
const date = ref(new Date())

const today = new Date()
today.setMonth(today.getMonth() + 2)
const maxDate = ref(today)

const formatCurrency = (value) => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })
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
