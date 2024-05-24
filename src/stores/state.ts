import { computed, reactive, toRefs } from 'vue'

const config = reactive({
    newTransaction: {}
})

export function state() {

    const onNewTransaction = (txn: {}) => {
        config.newTransaction = txn
    }
    
    const onResetTransaction = () => {
        config.newTransaction = {}
    }

    const isNewTransaction = computed(() => config.newTransaction)

    return { config: toRefs(config), onNewTransaction, onResetTransaction, isNewTransaction }
}