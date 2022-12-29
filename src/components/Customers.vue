<template>
    <div>
        <div class="main-panel">
            <div class="table-actions flex space">
                <div class="width-2">
                    <a-input-search v-model:value="cerca" placeholder="Chercher..." style="width: 100%" @input="onSearch"/>
                </div>
                <div class="width-2">
                    <div class="item-fr">
                        <a-button type="primary" @click="pop(null)">Inviter un client</a-button>
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
        <a-modal v-model:visible="visible" title="Informations concernant le client">
            <template #footer>
                <a-popconfirm v-if="form._id" title="Cela supprimera également toutes les demandes des clients" ok-text="Oui" cancel-text="Non" @confirm="delUser">
                    <a-button key="back" danger>Delete client</a-button>
                  </a-popconfirm>
                <a-button key="back" @click="visible = false">Annuler</a-button>
                <a-button key="submit" type="primary" :loading="loadBtn" @click="handleOk">Submit</a-button>
            </template>

            <form @submit.prevent="createRequest">
                <div class="grid grid-2">
                    <div class="ui-form">
                        <label class="ui-label">Prénom</label>
                        <a-input v-model:value="form.fname" placeholder="Sara" required />
                    </div>
                    <div class="ui-form">
                        <label class="ui-label">Nom de famille</label>
                        <a-input v-model:value="form.lname" placeholder="Davino" required />
                    </div>
                </div>
                <div class="ui-form mt-10">
                    <label class="ui-label">E-mail</label>
                    <a-input :disabled="form._id ? true : false" v-model:value="form.email" type="email" placeholder="sara@company.com" required />
                </div>
                <div class="ui-form mt-10">
                    <label class="ui-label">Compagnie</label>
                    <a-input v-model:value="form.company" placeholder="S&D LLC" required />
                </div>
                <a-button htmlType="submit" id="create-req"></a-button>
            </form>
        </a-modal>

    </div>
</template>

<script>
import { doc, setDoc, onSnapshot, collection, query } from "firebase/firestore"; 
import {  onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";

import  { Table, Button, InputSearch, Modal, Input, Popconfirm, message } from 'ant-design-vue';
import {  cusColumns, db, auth, manageCookies, loginErr, mailer, delDocument, singleCustomerAutos } from '../utils'
import { FormOutlined } from '@ant-design/icons-vue'


export default {
    components:{
         FormOutlined,
        'a-table': Table, 'a-button': Button, 'a-input-search': InputSearch,
        'a-modal': Modal, 'a-input': Input, 'a-popconfirm': Popconfirm
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
            let pw = `zE${Math.floor(Math.random()*90000) + 10000}`

            createUserWithEmailAndPassword(auth, this.form.email, pw)
            .then((q) => {
                this.saveUser(q.user)
                let msg = `Bonjour ${this.form.fname} ${this.form.lname} <br><br>
                 E-volts Automobiles vous invite à utiliser son portail client pour gérer vos demandes d'entretien automobile.
                 Utilisez les informations ci-dessous pour vous connecter: <br> E-mail: ${q.user.email} <br> Mot de passe: ${pw} <br> URL de connexionL: ${location.origin}/login
                 <br><br> Assurez-vous de réinitialiser votre mot de passe dès que possible.`
                mailer(q.user.email, 'Invitation', msg)
            }).catch((err) => {
                let error = loginErr(err.message)
                console.log(err.message);
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
        },
        async delUser(){
            delDocument('customers', this.form.email)
            const shot = await singleCustomerAutos(this.form._id)
            shot.forEach(el => delDocument('requests', el.data()._id))
        }
    },
    mounted(){
        onAuthStateChanged(auth, (user) => {
        if (!user || manageCookies(user.email, 'get') != 'admin') return location.href = '/login'
          this.currentUser = user
          mount()
        })

        const mount = () => {
           onSnapshot(query(collection(db, 'customers')), (querySnapshot) => {   
             let data = [] 
             querySnapshot.forEach((doc) => data.push(doc.data()))
             this.customers = data
             this.store = data
         })
        }
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