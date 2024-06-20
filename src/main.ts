import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import TabMenu from 'primevue/tabmenu'
import Toolbar from 'primevue/toolbar'
import SplitButton from 'primevue/splitbutton'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Sidebar from 'primevue/sidebar'
import SelectButton from 'primevue/selectbutton'
import InputSwitch from 'primevue/inputswitch'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import { useAccountStore } from './stores/account'
import { useBudgetStore } from './stores/budget'

import '@/assets/styles.scss';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue)
app.use(ToastService)
app.component('Sidebar', Sidebar);
app.component('InputText', InputText)
app.component('Button', Button)
app.component('FloatLabel', FloatLabel)
app.component('Toast', Toast)
app.component('TabMenu', TabMenu)
app.component('Toolbar', Toolbar)
app.component('SplitButton', SplitButton)
app.component('InputIcon', InputIcon)
app.component('IconField', IconField)
app.component('InputGroup', InputGroup)
app.component('InputGroupAddon', InputGroupAddon)
app.component('InputNumber', InputNumber)
app.component('Dropdown', Dropdown)
app.component('SelectButton', SelectButton)
app.component('InputSwitch', InputSwitch)
app.component('Calendar', Calendar)
app.component('Dialog', Dialog)

const accountStore = useAccountStore()
accountStore.initialize()

// Generate snapshots data structure
const budgetStore = useBudgetStore()
budgetStore.initialize()

app.mount('#app')