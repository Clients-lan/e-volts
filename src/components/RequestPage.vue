<template>
    <div>
        <div class="main-panel">
            <div class="table-actions flex space">
                <div class="width-2">
                    <a-input-search v-model:value="cerca" placeholder="Chercher..." style="width: 100%" @input="onSearch"/>
                </div>
                <div class="width-2">
                    <div class="item-fr">
                        <a-button type="primary" @click="newOrder">Créer une demande</a-button>
                    </div>
                </div>
            </div>
            <a-table :columns="columns" :data-source="requests" :pagination="{ pageSize: 10 }" :loading="loading">
                <template #headerCell="{ column }">
                 <template v-if="column.dataIndex === 'plates'">
                    <span>
                     {{ column.title }} 
                     <a-tooltip>
                        <template #title>Hé! Cliquez sur le numéro d'immatriculation de la voiture de toute demande et voyez ce qui se passe</template>
                        <InfoCircleOutlined />
                    </a-tooltip>
                    </span>
                 </template>
                </template>
                <template #bodyCell="{ column, text }">
                    <template v-if="column.dataIndex === 'status'">
                        <a-tag  :color="tagMaker(text)">{{ text }}</a-tag>
                    </template>
                    <template v-if="column.dataIndex === 'client_id'">
                        {{ findCustomer(text, customers) }}
                    </template>
                    <template v-if="column.dataIndex === 'location'">
                        {{ truncate(text, 10) }}
                    </template>
                    <template v-if="column.dataIndex === 'plates'">
                        <span style="cursor: pointer;" @click="showDesc(text)">{{ text }}</span>
                    </template>
                    <template v-if="column.dataIndex === 'urgency'">
                        <a-tag :color="tagMaker(text)">{{ text }}</a-tag>
                    </template>
                    <template v-if="column.key === 'operation'">
                        <a :href="`/requests/${text}/`">
                         <a-button type="dashed" size="small" shape="circle">
                            <template #icon><ArrowRightOutlined /></template>
                         </a-button>
                        </a>
                    </template>
                </template>
            </a-table>
        </div>

        <!-- Modal for request creation -->
        <a-modal v-model:visible="visible" title="Créer une nouvelle demande">
            <template #footer>
                <a-button key="back" @click="visible = false">Annuler</a-button>
                <a-button key="submit" type="primary" :loading="loadBtn" @click="handleOk">Submit</a-button>
            </template>

            <form @submit.prevent="createRequest">
                <div class="grid grid-2">
                    <div class="ui-form">
                        <label class="ui-label">Modèle</label>
                        <a-input v-model:value="form.name" placeholder="Modèle de voiture" required />
                    </div>
                    <div class="ui-form">
                        <label class="ui-label">Point de chute</label>
                        <a-select placeholder="Sélectionner" style="width: 100%" v-model:value="form.location" required>
                          <a-select-option v-for="(item, index) in locations" :key="index" :value="item.location">{{ truncate(item.location, 28) }}</a-select-option>
                        </a-select>
                    </div>
                    <div class="ui-form">
                        <label class="ui-label">Urgency</label>
                        <a-select placeholder="Sélectionner" style="width: 100%" v-model:value="form.urgency" required>
                          <a-select-option v-for="item in sAttrs.urgency" :key="item" :value="item">{{ item }}</a-select-option>
                        </a-select>
                    </div>
                    <div v-if="admin != 'admin'" class="ui-form">
                        <label class="ui-label">Date de ramassage</label>
                        <a-date-picker style="width: 100%" placeholder="Choisis une date" v-model:value="dueDate" />
                    </div>
                    <div v-else class="ui-form">
                        <label class="ui-label">Client</label>
                        <a-select placeholder="Select" style="width: 100%" v-model:value="form.client_id" required>
                          <a-select-option v-for="item in customers" :key="item._id" :value="item._id">{{ item.fname }} {{ item.lname }}</a-select-option>
                        </a-select>
                    </div>
                    <div class="ui-form">
                     <label class="ui-label">Immatriculation</label>
                     <a-input v-model:value="form.plates" placeholder="Entrez le numéro d'immatriculation" required />
                    </div>
                    <div class="ui-form">
                     <label class="ui-label">Marque</label>
                     <a-input v-model:value="form.brand" placeholder="Entrez la marque" required />
                    </div>
                </div>

                <div class="ui-form mt-20">
                    <label class="ui-label">Remarque/Description</label>
                    <a-textarea v-model:value="form.desc" placeholder="Décrivez le service ou les problèmes" :rows="4" required />
                </div>
                <div class="ui-form">
                    <a-upload-dragger name="file" :multiple="true" @change="attachFiles">
                    <p class="ant-upload-drag-icon">
                       <CloudUploadOutlined />
                    </p>
                    <p class="ant-upload-text">Documents et photographies</p>
                    <p class="ant-upload-hint">Cliquez ou faites glisser le fichier dans cette zone pour le télécharger</p>
                    </a-upload-dragger>
                </div>
                <a-button htmlType="submit" id="create-req"></a-button>
            </form>
        </a-modal>

    </div>
</template>

<script>
import { doc, setDoc, getDocs, onSnapshot, collection, query, where } from "firebase/firestore"; 
import {  onAuthStateChanged } from "firebase/auth";

import  { Table, Tag, Button, InputSearch, Modal, Select, SelectOption, DatePicker, Input, Textarea, UploadDragger, notification, Tooltip, message } from 'ant-design-vue';
import {  reqColumns, saveAttachment, db, auth, tagMaker, findCustomer, sAttrs, manageCookies, getDocuments, truncate, mailer, sea, mailConstructor } from '../utils'
import { ArrowRightOutlined, CloudUploadOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { generate } from 'short-uuid'
import dayjs from 'dayjs'


export default {
    components:{
        ArrowRightOutlined, CloudUploadOutlined, InfoCircleOutlined,
        'a-table': Table, 'a-tag': Tag, 'a-button': Button, 'a-input-search': InputSearch,
        'a-modal': Modal, 'a-select': Select, 'a-select-option': SelectOption, 
        'a-upload-dragger': UploadDragger, 'a-date-picker': DatePicker, 'a-input': Input,
        'a-textarea': Textarea, 'a-tooltip': Tooltip
    },
    data: () => ({
        loading: false, columns: reqColumns, requests: [], customers: [],
        watingUploads: [], cerca: null, visible: false, sAttrs, dueDate: null,
        admin: null, currentUser: {}, loadBtn: false, form: sAttrs.formAttr,
        locations: [], store: []
    }),
    methods:{
     handleUpload (){
            Promise.all(this.watingUploads.map(el => saveAttachment(el)))
            .then(firebaseAttrs => {
                firebaseAttrs.forEach(el => this.form['files'].push(el))
                this.watingUploads = []
                this.createRequestExtended()
            })
        },
        attachFiles(e) {
            this.watingUploads = []
            Promise.all([...e.fileList].map(el => this.watingUploads.push(el.originFileObj)))
        },
        async createRequestExtended(){
            let owner = this.customers.filter(a => a._id == this.form.client_id)[0], oid = Math.floor(Math.random()*90000) + 10000
            if(!owner) return message.error(`Ce client n'existe pas`)

            this.form = {...this.form, ...{_id: generate(), due: dayjs(this.dueDate || new Date()).format(), orderid: oid }}
            await setDoc(doc(db, "requests", this.form._id),  this.form);
            //@reset attrs
            this.loadBtn = false
            this.visible = false

            let msg = `Bonjour, Votre demande {RID} a bien été reçu pour le véhicule {marque}; {modele}; {CRN} Nous reviendrons vers vous si besoin d’informations supplémentaires, Merci`
            if(this.admin == 'customer'){
              let msg1 = `Hi E-volts Automobiles, you have a new requests from  one of your customers`
              return mailer(null, 'Service request', msg1)
            }
            let nMsg = mailConstructor(owner, this.form, msg)
            mailer(owner.email, 'Demande créée', nMsg)
        },
        handleOk(){
            if(!this.form.client_id || !this.form.location || !this.form.urgency){
                return message.warning('Veuillez remplir tous les champs obligatoires')
            }
            document.querySelector('#create-req').click()
        },
        onSearch(s){
            let sh = s.target.value.trim()
            if(typeof sh !== 'string') return this.requests = this.store
            this.requests = this.store.filter(i => sea(i.name, sh) || sea(i.plates, sh) || sea(i.orderid.toString(), sh))
        },
        async customerOnly(){
            const q = query(collection(db, 'requests'), where("client_id", "==", this.form.client_id))
            onSnapshot(q, (querySnapshot) => {   
                let data = [] 
                querySnapshot.forEach((doc) =>  data.push(doc.data()))
                this.requests = data
                this.store = data
            })

            let user = await getDocuments(this.currentUser.uid, 'customers')
            this.customers = user
        },
        createRequest(){
            this.loadBtn = true
            if(this.watingUploads.length > 0) return this.handleUpload()
            this.createRequestExtended()
        },
        newOrder(){
           if(this.locations.length == 0){
                this.queryListener('locations')
            }
            this.form = {}
            this.form = sAttrs.formAttr
            this.visible = true
        },
        queryListener(q){
          onSnapshot(query(collection(db, q)), (querySnapshot) => {   
                let data = [] 
                querySnapshot.forEach((doc) => data.push(doc.data()));
                q == 'requests' ? this.requests = data : q == 'locations' ? this.locations = data : this.customers = data
                if(q == 'requests') this.store = data
            })
        },
        showDesc(plate){
            let desc = this.requests.filter(a =>  a.plates == plate)
            if(desc.length == 0) return
            notification['info']({ message: `Demande de note (${desc[0].plates})`, description: desc[0].desc })
        },
        //@ helpers
        tagMaker, findCustomer, truncate
    },
    mounted(){
           //@check if user is admin
           onAuthStateChanged(auth, (user) => {
            if (!user) return location.href = '/login'
                this.currentUser = user
                this.admin = manageCookies(user.email, 'get')
                this.form['client_id'] = this.admin == 'admin' ? null : user.uid

                if(this.admin == 'customer') return this.customerOnly()
                if(this.columns.length == 7){
                   this.columns.splice(4, 0, { title: 'Propriétaire', dataIndex: 'client_id', responsive: ['sm'] })
                   this.columns.join()
                }
                this.queryListener('customers')
                this.queryListener('requests')
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