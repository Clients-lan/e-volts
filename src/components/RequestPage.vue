<template>
    <div>
        <div class="main-panel">
            <div class="table-actions flex space">
                <div class="width-2">
                    <a-input-search v-model:value="cerca" placeholder="Search..." style="width: 100%" @input="onSearch"/>
                </div>
                <div class="width-2">
                    <div class="item-fr">
                        <a-button type="primary" @click="visible = true">Créer une demande</a-button>
                    </div>
                </div>
            </div>
            <a-table :columns="columns" :data-source="requests" :pagination="{ pageSize: 10 }" :loading="loading">
                <template #bodyCell="{ column, text }">
                    <template v-if="column.dataIndex === 'status'">
                        <a-tag :color="tagMaker(text)">{{ text }}</a-tag>
                    </template>
                    <template v-if="column.dataIndex === 'client_id'">
                        {{ findCustomer(text, customers) }}
                    </template>
                    <template v-if="column.dataIndex === 'location'">
                        {{ truncate(text, 10) }}
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
                <a-button key="back" @click="visible = false">Cancel</a-button>
                <a-button key="submit" type="primary" :loading="loadBtn" @click="handleOk">Submit</a-button>
            </template>

            <form @submit.prevent="createRequest">
                <div class="grid grid-2">
                    <div class="ui-form">
                        <label class="ui-label">Service name</label>
                        <a-input v-model:value="form.name" placeholder="Enter title" required />
                    </div>
                    <div class="ui-form">
                        <label class="ui-label">Location</label>
                        <a-select placeholder="Select" style="width: 100%" v-model:value="form.location" required>
                          <a-select-option v-for="(item, index) in locations" :key="index" :value="item.location">{{ truncate(item.location, 28) }}</a-select-option>
                        </a-select>
                    </div>
                    <div class="ui-form">
                        <label class="ui-label">Urgency</label>
                        <a-select placeholder="Urgency" style="width: 100%" v-model:value="form.urgency" required>
                          <a-select-option v-for="item in sAttrs.urgency" :key="item" :value="item">{{ item }}</a-select-option>
                        </a-select>
                    </div>
                    <div v-if="admin != 'admin'" class="ui-form">
                        <label class="ui-label">Pick up date</label>
                        <a-date-picker style="width: 100%" v-model:value="dueDate" />
                    </div>
                    <div v-else class="ui-form">
                        <label class="ui-label">Customer</label>
                        <a-select placeholder="Select" style="width: 100%" v-model:value="form.client_id" required>
                          <a-select-option v-for="item in customers" :key="item._id" :value="item._id">{{ item.fname }} {{ item.lname }}</a-select-option>
                        </a-select>
                    </div>
                </div>
                <div class="ui-form mt-10">
                    <label class="ui-label">Vehicle plate number(s)</label>
                    <a-input v-model:value="form.plates" placeholder="Eg. 39393, 39393" required />
                </div>
                <div class="ui-form mt-20">
                    <label class="ui-label">Description</label>
                    <a-textarea v-model:value="form.desc" placeholder="Describe service or issues" :rows="4" required />
                </div>
                <div class="ui-form">
                    <a-upload-dragger name="file" :multiple="true" @change="attachFiles">
                    <p class="ant-upload-drag-icon">
                       <CloudUploadOutlined />
                    </p>
                    <p class="ant-upload-text">Documents & photos</p>
                    <p class="ant-upload-hint">Click or drag file to this area to upload</p>
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

import  { Table, Tag, Button, InputSearch, Modal, Select, SelectOption, DatePicker, Input, Textarea, UploadDragger, message } from 'ant-design-vue';
import {  reqColumns, saveAttachment, db, auth, tagMaker, findCustomer, sAttrs, manageCookies, getDocuments, truncate, mailer } from '../utils'
import { ArrowRightOutlined, CloudUploadOutlined } from '@ant-design/icons-vue'
import { generate } from 'short-uuid'
import dayjs from 'dayjs'


export default {
    components:{
        ArrowRightOutlined, CloudUploadOutlined,
        'a-table': Table, 'a-tag': Tag, 'a-button': Button, 'a-input-search': InputSearch,
        'a-modal': Modal, 'a-select': Select, 'a-select-option': SelectOption, 
        'a-upload-dragger': UploadDragger, 'a-date-picker': DatePicker, 'a-input': Input,
        'a-textarea': Textarea
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
            this.form['_id'] = generate()
            this.form['due'] = dayjs(this.dueDate || new Date()).format()
            await setDoc(doc(db, "requests", this.form._id),  this.form);

            //@reset attrs
            this.form = sAttrs.formAttr
            this.loadBtn = false
            this.visible = false
            if(this.admin == 'customer'){
              let msg = `Hi E-volts, you have a new requests from  one of your customers`
              mailer(null, 'Service request', msg)
            }
        },
        handleOk(){
            if(!this.form.client_id || !this.form.location || !this.form.urgency){
                return message.warning('Please fill in all the required files')
            }
            document.querySelector('#create-req').click()
        },
        onSearch(s){
            let sh = s.target.value || s
            if(typeof sh !== 'string') return this.requests = this.store
            this.requests = this.store.filter(i => i.name.toLowerCase().match(sh.toLowerCase()))
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
                queryListener('locations')

                if(this.admin == 'customer') return this.customerOnly()
                queryListener('customers')
                queryListener('requests')
            })

         
         const queryListener = (q) => {
            const qCustomers = query(collection(db, q))

            onSnapshot(qCustomers, (querySnapshot) => {   
                let data = [] 
                querySnapshot.forEach((doc) => data.push(doc.data()));
                q == 'requests' ? this.requests = data : 
                q == 'locations' ? this.locations = data : this.customers = data
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