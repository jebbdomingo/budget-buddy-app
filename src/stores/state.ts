import { computed, reactive, toRefs } from 'vue'

const config = reactive({
    newTransaction: {}
})

export function state() {

    const newTransaction = (txn: {}) => {
        config.newTransaction = txn
    }

    const isNewTransaction = computed(() => config.newTransaction)

    return { config: toRefs(config), newTransaction, isNewTransaction }
}