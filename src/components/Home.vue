<template>
    <div>
        <div class="main-panel">
            <div v-if="loading" class="home-tab">
                <a-skeleton  active :paragraph="{ rows: 4 }" :loading="loading" />
            </div>
            <div v-else class="home-tab">
                <div class="grid grid-2">
                    <div class="stats">
                    <a-statistic title="Total" :value="requests.length">
                    <template #suffix>
                        <car-outlined />
                        </template>
                    </a-statistic>
                </div>
                <div class="stats">
                    <a-statistic title="En cours" :value="stats.a">
                    <template #suffix>
                       <fieldtime-outlined />
                        </template>
                    </a-statistic>
                </div>
                <div class="stats">
                    <a-statistic title="Complété" :value="stats.b">
                    <template #suffix>
                       <trophy-outlined />
                        </template>
                    </a-statistic>
                </div>
                <div class="stats">
                    <a-statistic title="Urgent" :value="stats.c">
                    <template #suffix>
                       <thunderbolt-outlined />
                        </template>
                    </a-statistic>
                  </div>
                </div>
                <a-button type="primary" shape="round" @click="goReq" class="mt-20" block>Voir toutes les demandes</a-button>
            </div>

        </div>
    </div>
</template>

<script>
import { Statistic, Skeleton, Button } from 'ant-design-vue'
import { CarOutlined, FieldTimeOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons-vue'
import {  onAuthStateChanged } from "firebase/auth";
import { manageCookies, getDocuments, auth, sAttrs, db, singleCustomerAutos } from '../utils'

export default {
    components:{
         'a-statistic': Statistic, 'a-skeleton': Skeleton, 'a-button': Button,
         'car-outlined': CarOutlined, 'fieldtime-outlined': FieldTimeOutlined,
         'thunderbolt-outlined': ThunderboltOutlined, 'trophy-outlined': TrophyOutlined
    },
    data: () => ({
        admin: null, requests: [], currentUser: {},
        stats: {}, loading: true
    }),
    methods:{
        async ready(){
            if(this.admin == 'customer') return await this.clientOnly() 
            this.requests = await getDocuments(null, 'requests', true)
            setTimeout(() => this.prepStats(), 500);
        },
        async clientOnly(){
            const querySnapshot = await singleCustomerAutos(this.currentUser.uid)
            querySnapshot.forEach((doc) => {
                if(doc.data()) this.requests.push(doc.data())
            })
            setTimeout(() => this.prepStats(), 500);
        },
        prepStats(){
            this.stats['a'] = this.requests.filter(a => a.status == sAttrs.status[1]).length
            this.stats['b'] = this.requests.filter(a => a.status == sAttrs.status[3]).length
            this.stats['c'] = this.requests.filter(a => a.urgency == sAttrs.urgency[2]).length
            this.loading = false
        },
        goReq(){
            location.href = '/requests'
        }
    },
    mounted(){
        onAuthStateChanged(auth, (user) => {
        if (!user) return location.href = '/login'
            this.currentUser = user
            this.admin = manageCookies(user.email, 'get')
            this.ready()
        })
    }
}
</script>


<style lang="scss" scoped>
@import '../assets/app.scss';

.main-panel{
    .home-tab{
        background: #fff;
        padding: 20px;
        max-width: 600px;
        margin: 50px auto;
        text-align: center;
        box-shadow: $box-one;
        border-radius: 10px;
        .grid{
            grid-gap: 30px;
        }
    }
}
</style>