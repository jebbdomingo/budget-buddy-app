<script setup>
import { ref } from 'vue'
import AppMenuItem from './AppMenuItem.vue'
import TransactionView from '../views/TransactionView.vue'
import { transactionModalVisible } from '../stores/state'

const model = ref([
    {
        label: 'Home',
        items: [
            { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Accounts', icon: 'pi pi-fw pi-dollar', to: '/accounts' },
            { label: 'Transaction', icon: 'pi pi-fw pi-plus-circle', command: () => {
                transactionModalVisible.value = true
            } }
        ]
    }
])
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>

    <TransactionView />
</template>

<style lang="scss" scoped></style>
