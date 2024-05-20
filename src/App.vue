<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseLayout from './BaseLayout.vue'
import { RouterLink, RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'


const toast = useToast()
const transactionModalVisible = ref(false)

const tabs = ref([
    { label: 'Budget', icon: 'pi pi-envelope', route: '/' },
    { label: 'Accounts', icon: 'pi pi-dollar', route: '/accounts' },
    { label: 'Transaction', icon: 'pi pi-plus-circle', command: () => {
        transactionModalVisible.value = true
    }}
])

</script>

<template>
    
    <Toast />

    <BaseLayout>
        <template #default>
            <RouterView />
        </template>

        <template #footer>
            <div class="card">
                <TabMenu :model="tabs">
                    <template #item="{ item, props }">
                        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                            <a v-ripple :href="href" v-bind="props.action" @click="navigate">
                                <span v-bind="props.icon" />
                                <span v-bind="props.label">{{ item.label }}</span>
                            </a>
                        </router-link>
                        <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
                            <span v-bind="props.icon" />
                            <span v-bind="props.label">{{ item.label }}</span>
                        </a>
                    </template>
                </TabMenu>
            </div>
        </template>
    </BaseLayout>
  
</template>

<style scoped>
</style>
