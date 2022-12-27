<template>
    <div>
        <div class="main-panel">
            <div class="table-actions flex space">
                <div class="width-2">
                    <a-input-search v-model:value="cerca" placeholder="Search..." style="width: 100%" @input="onSearch"/>
                </div>
                <div class="width-2">
                    <div class="item-fr">
                        <a-button type="primary" @click="pop(null)">Invite customer</a-button>
                    </div>
                </div>
            </div>
            <a-table :columns="columns" :data-source="customers" :pagination="{ pageSize: 10 }" :loading="loading">
                <template #bodyCell="{ column, text }">
                    <template v-if="column.key === 'operation'">
                         <a-button type="dashed" @click="pop(text)" size="small" shape="circle">
                            <template #icon><FormOutlined /></template>
                         </a-button>
                    </template>
                </template>
            </a-table>
        </div>


        <!-- Modal for request creation -->
        <a-modal v-model:visible="visible" title="Customer info">
            <template #footer>
                <a-button key="back" @click="visible = false">Cancel</a-button>
                <a-button key="submit" type="primary" :loading="loadBtn" @click="handleOk">Submit</a-button>
            </template>

            <form @submit.prevent="createRequest">
                <div class="grid grid-2">
                    <div class="ui-form">
                        <label class="ui-label">First name</label>
                        <a-input v-model:value="form.fname" placeholder="Enter first name" required />
                    </div>
                    <div class="ui-form">
                        <label class="ui-label">Last name</label>
                        <a-input v-model:value="form.lname" placeholder="Enter last name" required />
                    </div>
                </div>
                <div class="ui-form mt-10">
                    <label class="ui-label">Customer email</label>
                    <a-input v-model:value="form.email" type="email" placeholder="Enter email address" required />
                </div>
                <div class="ui-form mt-10">
                    <label class="ui-label">Company</label>
                    <a-input v-model:value="form.company" placeholder="Company or business name" required />
                </div>
                <a-button htmlType="submit" id="create-req"></a-button>
            </form>
        </a-modal>

    </div>
</template>

<script>
import { doc, setDoc, onSnapshot, collection, query } from "firebase/firestore"; 
import {  onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";

import  { Table, Button, InputSearch, Modal, Input, message } from 'ant-design-vue';
import {  cusColumns, db, auth, manageCookies, loginErr, mailer } from '../utils'
import { FormOutlined } from '@ant-design/icons-vue'


export default {
    components:{
         FormOutlined,
        'a-table': Table, 'a-button': Button, 'a-input-search': InputSearch,
        'a-modal': Modal, 'a-input': Input,
    },
    data: () => ({
        loading: false, columns: cusColumns, customers: [],
        cerca: null, visible: false, store: [],
        currentUser: {}, loadBtn: false, form: {},
    }),
    methods:{
        handleOk(){
            document.querySelector('#create-req').click()
        },
        onSearch(s){
            let sh = s.target.value || s
            if(typeof sh !== 'string') return this.customers = this.store
            this.customers = this.store.filter(i => i.fname.toLowerCase().match(sh.toLowerCase()) || i.email.toLowerCase().match(sh.toLowerCase()))
        },
        pop(id){
            this.visible = true
            if(id == null) return this.form = {}
            this.form = this.customers.filter(a => a._id == id)[0]
        },
        createRequest(){
            this.loadBtn = true
            if(this.form._id) return this.saveUser(this.form)

            createUserWithEmailAndPassword(auth, this.form.email, '1234567')
            .then((user) => {
                let u = user.user
                this.saveUser(u)
                mailer(u.email, 'Invitation', 'Hello there you have been invited')
            }).catch((err) => {
                let error = loginErr(err.message)
                message.error(error)
                this.doLoading(false, true)
            })
        },
         async saveUser(user){
            await setDoc(doc(db, "customers", user.email),  {
            ...this.form,
            ...{ _id: user.uid || user._id, date: user.uid ? new Date().toDateString() : user.date }
          })
          this.doLoading(false, false)
          this.form = {} 
          message.success('Saved successfully!')
        },
        doLoading(btn, modal){
          this.loadBtn = btn
          this.visible = modal
        }
    },
    mounted(){
        onAuthStateChanged(auth, (user) => {
        if (!user || manageCookies(user.email, 'get') != 'admin') return location.href = '/login'
          this.currentUser = user
        })

        const qCustomers = query(collection(db, 'customers'))
        onSnapshot(qCustomers, (querySnapshot) => {   
          let data = [] 
          querySnapshot.forEach((doc) => data.push(doc.data()))
          this.customers = data
          this.store = data
        })
    }
}
</script>


<style lang="scss" scoped>


.table-actions{
    background: #fff;
    padding: 20px;
}

.grid{
 .ui-form{
    margin-bottom: 5px;
}
}
</style>